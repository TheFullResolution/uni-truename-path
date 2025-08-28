#!/bin/bash

# Port cleanup script for development environment
# Efficiently terminates processes on commonly used development ports

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Port ranges to check
PORT_RANGES=(
  "3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010"
  "4000 4001 4002 4003 4004 4005 4006 4007 4008 4009 4010"
  "4500 4501 4502 4503 4504 4505 4506 4507 4508 4509 4510"
)

echo -e "${YELLOW}🔍 Scanning for processes on development ports...${NC}"

killed_count=0
total_checked=0

# Function to check and kill processes on a specific port
check_and_kill_port() {
  local port=$1
  local pids
  
  # Use lsof to find processes listening on the port
  pids=$(lsof -ti:$port 2>/dev/null || true)
  
  if [ ! -z "$pids" ]; then
echo -e "${RED}🔴 Killing process(es) on port $port: $pids${NC}"
echo "$pids" | xargs kill -9 2>/dev/null || true
return 1  # Indicates a process was killed
  fi
  
  return 0  # Indicates no process was found
}

# Process all port ranges
for range in "${PORT_RANGES[@]}"; do
  for port in $range; do
total_checked=$((total_checked + 1))

if ! check_and_kill_port $port; then
  killed_count=$((killed_count + 1))
fi
  done
done

# Summary output
echo ""
if [ $killed_count -eq 0 ]; then
  echo -e "${GREEN}✅ No processes found on any of the $total_checked checked ports${NC}"
else
  echo -e "${GREEN}✅ Killed $killed_count process(es) across $total_checked checked ports${NC}"
fi

echo -e "${YELLOW}🚀 Ports are now clean and ready for development!${NC}"