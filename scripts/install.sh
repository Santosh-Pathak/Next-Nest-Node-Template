#!/bin/bash

user=$(id -u -n)
group=$(id -g -n)
arch=$(dpkg --print-architecture)
node_exporter_version="1.9.1"
prom_version="3.1.0"
hostname=$(hostname)
role=$(echo $hostname | cut -d '-' -f 2)

function install_alloy() {

    sudo apt update
    sudo apt upgrade -y
    sudo apt install gpg
    sudo mkdir -p /etc/apt/keyrings/
    wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
    echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
    sudo apt-get update
    sudo apt-get install alloy -y
}

function mount_disk() {
    disk_id=$(sudo blkid|grep sdc1|grep -o UUID=.*BLOCK_SIZE|cut -d ' ' -f1|sed 's|"||g')

    if [[ $disk_id == "" ]]; then

        sudo parted /dev/sdc --script mklabel gpt mkpart xfspart xfs 0% 100%
        sudo mkfs.xfs /dev/sdc1
        sudo partprobe /dev/sdc1
    fi

    sudo mkdir /app_data
    disk_id=$(sudo blkid|grep sdc1|grep -o UUID=.*BLOCK_SIZE|cut -d ' ' -f1|sed 's|"||g')
    sudo tee -a /etc/fstab<<EOF
    $disk_id    /app_data   xfs   defaults,nofail   1   2
EOF
    sudo systemctl daemon-reload
    sudo mount -a
    
}

function install_node_exporter() {

    wget https://github.com/prometheus/node_exporter/releases/download/v${node_exporter_version}/node_exporter-${node_exporter_version}.linux-${arch}.tar.gz
    tar -xvzf node_exporter-${node_exporter_version}.linux-${arch}.tar.gz
    sudo mv node_exporter-${node_exporter_version}.linux-${arch} /app_data

    sudo tee /etc/systemd/system/node_exporter.service<<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=$user
Group=$group
Type=simple
ExecStart=/app_data/node_exporter-${node_exporter_version}.linux-amd64/node_exporter
[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl start node_exporter
    sudo systemctl enable node_exporter
    # sudo systemctl status node_exporter
    rm node_exporter-${node_exporter_version}.linux-${arch}.tar.gz;
    # sudo iptables -I INPUT -p tcp --dport 9100  -j ACCEPT
}

mount_disk
install_node_exporter
install_alloy

# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot
sudo apt install certbot python3-certbot-nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot (non-interactive)
pm2_user="${SUDO_USER:-$user}"
node_path="$(which node)"
node_dir="$(dirname "$node_path")"
pm2_home="/home/$pm2_user"
sudo env PATH="$PATH:$node_dir" pm2 startup systemd -u "$pm2_user" --hp "$pm2_home"
sudo pm2 save

# certbot certonly --webroot -w  /var/www/html/ -d tdk-billing-service.tedekstra.com -d www.tdk-billing-service.tedekstra.com --email "support.infra@tedekstra.com"
# Alloy: set ALLOY_BASIC_AUTH_PASSWORD in the service Environment= before restart (never commit the password).
# e.g. echo 'Environment=ALLOY_BASIC_AUTH_PASSWORD=...' >> /etc/systemd/system/alloy.service.d/override.conf
setcap CAP_DAC_READ_SEARCH+ep /usr/bin/alloy ;systemctl restart alloy
# deepak.keshari@tdkglobal.com
touch backend.env frontend.env
