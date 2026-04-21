#!/bin/bash

# /home/admin_user/apps/scripts/run-app.sh
echo "running for ==${1}== "

if [[ $1 == "fe" ]]; then
    # Frontend deployment
    cwd="/home/admin_user/apps/frontend"
    
    # Kill existing process if running
    pid=$(ss -lptn 'sport = :3000' | grep -o 'pid=.*,' | cut -d '=' -f2 | sed -e 's|,||g')
    if [ -n "$pid" ]; then
        echo "Killing existing frontend process (PID: $pid)"
        kill -9 $pid
        rm -rf $cwd
    else
        echo "No existing frontend process found"
    fi
    
    mkdir $cwd
    cd "$cwd" || exit 1
    tar -xzf ../frontend.tar
    [ -f "/home/admin_user/frontend.env" ] && cp "/home/admin_user/frontend.env" .env
    . .env
    
    echo "Starting Frontend App..."
    nohup npm start > apps.log 2>&1 &
    echo "Frontend started on port 3000"

elif [[ $1 == "be" ]]; then
    # Backend deployment (unchanged from previous version)
    cwd="/home/admin_user/apps/backend"

    if [ "$2" == "clean" ]; then
        pid=$(ss -lptn 'sport = :8080' | grep -o 'pid=.*,' | cut -d '=' -f2 | sed -e 's|,||g')
        echo "Killing existing backend process (PID: $pid)"
        kill -9 $pid || echo "No backend process to kill"
        rm -rf $cwd
    else
        echo "No existing backend process found"
    fi
    
    mkdir -p "$cwd"
    cd "$cwd" || exit 1
    
    echo "Setting up Backend..."
    [ -f "/home/admin_user/backend.env" ] && cp "/home/admin_user/backend.env" .env
    . .env
    npm install
    npm run build
    
    echo "Starting Backend App..."
    nohup npm start > apps.log 2>&1 &
    echo "Backend started on port 3001"
fi
