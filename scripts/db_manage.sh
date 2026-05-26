#!/usr/bin/env bash

# OpsPilot User-Space PostgreSQL Manager

WORKSPACE_DIR="/home/shekhar15/Documents/OpsPilot"
DB_DIR="$WORKSPACE_DIR/db_data"
LOG_FILE="$DB_DIR/logfile"
PG_BIN="/usr/lib/postgresql/16/bin"
PORT=5433

show_help() {
    echo "Usage: $0 {start|stop|status|restart|log|init|create-db}"
    echo "  start      - Start the local user-space PostgreSQL server"
    echo "  stop       - Stop the local user-space PostgreSQL server"
    echo "  status     - Check if the PostgreSQL server is running"
    echo "  restart    - Restart the PostgreSQL server"
    echo "  log        - Display the PostgreSQL server log output"
    echo "  init       - Initialize a clean Postgres database directory in db_data/"
    echo "  create-db  - Create the 'opspilot' database on port $PORT"
}

init_db() {
    echo "Initializing clean database cluster in $DB_DIR..."
    if [ -d "$DB_DIR/base" ]; then
        echo "Database already initialized in $DB_DIR."
        return 1
    fi
    mkdir -p "$DB_DIR"
    "$PG_BIN/initdb" -D "$DB_DIR" --auth-local=trust --auth-host=trust
    
    # Configure postgresql.conf to use port 5433 and local unix sockets
    CONF_FILE="$DB_DIR/postgresql.conf"
    sed -i "s/#port = 5432/port = $PORT/g" "$CONF_FILE"
    sed -i "s|#unix_socket_directories = '/var/run/postgresql'|unix_socket_directories = '$DB_DIR'|g" "$CONF_FILE"
    echo "Database initialized and configured on port $PORT successfully!"
}

start_db() {
    echo "Starting PostgreSQL on port $PORT..."
    if [ ! -d "$DB_DIR/base" ]; then
        init_db
    fi
    "$PG_BIN/pg_ctl" -D "$DB_DIR" -l "$LOG_FILE" start
}

stop_db() {
    echo "Stopping PostgreSQL..."
    "$PG_BIN/pg_ctl" -D "$DB_DIR" stop
}

status_db() {
    "$PG_BIN/pg_ctl" -D "$DB_DIR" status
}

show_log() {
    if [ -f "$LOG_FILE" ]; then
        tail -n 50 "$LOG_FILE"
    else
        echo "No log file found."
    fi
}

create_opspilot_db() {
    echo "Creating database 'opspilot' on port $PORT..."
    "$PG_BIN/createdb" -p "$PORT" -h localhost opspilot
    if [ $? -eq 0 ]; then
        echo "Database 'opspilot' created successfully."
    else
        echo "Failed to create database 'opspilot' or it already exists."
    fi
}

case "$1" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    status)
        status_db
        ;;
    restart)
        stop_db
        sleep 1
        start_db
        ;;
    log)
        show_log
        ;;
    init)
        init_db
        ;;
    create-db)
        create_opspilot_db
        ;;
    *)
        show_help
        exit 1
        ;;
esac
