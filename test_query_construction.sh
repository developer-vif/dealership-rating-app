#!/bin/bash

# Simple Query Construction Test
# Focuses on verifying the dealership name search query construction

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3002"
TEST_LAT="14.5995"
TEST_LNG="120.9842"

echo -e "${BLUE}DEALERSHIP NAME SEARCH - QUERY CONSTRUCTION TEST${NC}"
echo "=================================================="
echo ""

# Function to test and show query construction
test_query() {
    local test_name="$1"
    local params="$2"
    local expected_query="$3"
    
    echo -e "${YELLOW}$test_name${NC}"
    echo "Parameters: $params"
    echo "Expected Query: $expected_query"
    echo ""
    
    # Clear recent logs and make request
    echo "Making request..."
    curl -s "$BASE_URL/api/dealerships/search?lat=$TEST_LAT&lng=$TEST_LNG&radius=10&$params" > /dev/null
    
    # Wait a moment for logs to be written
    sleep 1
    
    # Extract query construction logs
    echo "Query Construction Log:"
    docker-compose logs --tail=50 backend 2>/dev/null | grep "Query construction" | tail -1 | sed 's/.*Query construction for Google Places search/Query construction:/'
    echo ""
    echo "---"
    echo ""
}

# Test scenarios
test_query \
    "1. Dealership name only" \
    "dealershipName=Toyota" \
    "Toyota"

test_query \
    "2. Dealership name + brand" \
    "dealershipName=Ford%20Makati&brand=Ford" \
    "Ford Makati Ford dealership"

test_query \
    "3. Complex dealership name" \
    "dealershipName=Car%20Empire%20Flagship" \
    "Car Empire Flagship"

test_query \
    "4. Brand only (for comparison)" \
    "brand=Honda" \
    "Honda dealership"

test_query \
    "5. No parameters (default)" \
    "" \
    "car dealership OR motorcycle dealership"

echo -e "${GREEN}Test completed. Check the query construction logs above.${NC}"
echo ""
echo "To see all recent logs:"
echo "docker-compose logs backend | grep -A5 -B5 'Query construction'"