#!/bin/bash

# Dealership Search API Test Script
# Tests the dealership name search functionality after bug fix
# Verifies query construction is working correctly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:3002"
SEARCH_ENDPOINT="$BASE_URL/api/dealerships/search"

# Test location (Manila, Philippines - from project context)
TEST_LAT="14.5995"
TEST_LNG="120.9842"
TEST_RADIUS="10"

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}  DEALERSHIP SEARCH API TEST SUITE${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Function to make API request and check response
test_search() {
    local test_name="$1"
    local url="$2"
    local expected_query_pattern="$3"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    echo -e "${BLUE}URL: $url${NC}"
    echo ""
    
    # Make the request and capture response
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$url")
    
    # Extract HTTP status
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "${BLUE}HTTP Status: $http_status${NC}"
    echo ""
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Request successful${NC}"
        
        # Parse and display relevant parts of the response
        echo -e "${BLUE}Response Summary:${NC}"
        echo "$body" | jq -r '
            if .success then
                "Success: " + (.success | tostring) + 
                "\nTotal Results: " + (.data.dealerships | length | tostring) +
                "\nHas Next Page: " + (if .data.nextPageToken then "Yes" else "No" end) +
                "\nPages Processed: " + (.meta.pagesProcessed | tostring) +
                "\nRadius Filtering: " + (.meta.radiusFiltering | tostring)
            else
                "Error: " + .error.message
            end
        '
        
        # Show first few dealership names if any results
        echo ""
        echo -e "${BLUE}Sample Dealerships Found:${NC}"
        echo "$body" | jq -r '.data.dealerships[0:3][] | "- " + .name + " (" + (.googleRating | tostring) + " stars)"' 2>/dev/null || echo "No dealerships found"
        
    else
        echo -e "${RED}❌ Request failed with status $http_status${NC}"
        echo -e "${RED}Response: $body${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Expected Query Pattern: $expected_query_pattern${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
    echo ""
}

# Function to check if the service is running
check_service() {
    echo -e "${YELLOW}Checking if backend service is running...${NC}"
    health_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/health" 2>/dev/null)
    health_status=$(echo "$health_response" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
    
    if [ "$health_status" = "200" ]; then
        echo -e "${GREEN}✅ Backend service is running${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Backend service is not running or not healthy${NC}"
        echo -e "${RED}Please start the service with: docker-compose up -d${NC}"
        echo ""
        return 1
    fi
}

# Function to show backend logs for query construction
show_logs() {
    echo -e "${YELLOW}Showing recent backend logs (query construction):${NC}"
    echo -e "${BLUE}docker-compose logs --tail=20 backend${NC}"
    echo ""
    docker-compose logs --tail=20 backend 2>/dev/null | grep -E "(Query construction|Making Google Places API request|Dealership search request)" | tail -10
    echo ""
    echo -e "${YELLOW}----------------------------------------${NC}"
    echo ""
}

# Check if service is running
if ! check_service; then
    exit 1
fi

# Test 1: Search with dealership name only
echo -e "${GREEN}TEST 1: Search with dealership name only${NC}"
test_search \
    "Toyota dealership search" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS&dealershipName=Toyota" \
    "Toyota"

# Test 2: Search with dealership name + brand
echo -e "${GREEN}TEST 2: Search with dealership name + brand${NC}"
test_search \
    "Ford dealership with brand search" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS&dealershipName=Makati%20Ford&brand=Ford" \
    "Makati Ford Ford dealership"

# Test 3: Search with dealership name + location (using location parameter)
echo -e "${GREEN}TEST 3: Search with dealership name + location${NC}"
test_search \
    "Honda dealership in Quezon City" \
    "$SEARCH_ENDPOINT?location=Quezon%20City,%20Philippines&radius=$TEST_RADIUS&dealershipName=Honda" \
    "Honda"

# Test 4: Search with complex dealership name
echo -e "${GREEN}TEST 4: Search with complex dealership name${NC}"
test_search \
    "Car Empire Flagship search" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS&dealershipName=Car%20Empire%20Flagship" \
    "Car Empire Flagship"

# Test 5: Search with brand only (for comparison)
echo -e "${GREEN}TEST 5: Search with brand only (for comparison)${NC}"
test_search \
    "Brand only search" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS&brand=Toyota" \
    "Toyota dealership"

# Test 6: Search with no specific parameters (default search)
echo -e "${GREEN}TEST 6: Default search (no brand or dealership name)${NC}"
test_search \
    "Default dealership search" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS" \
    "car dealership OR motorcycle dealership"

# Test 7: Search with dealership name containing spaces and special characters
echo -e "${GREEN}TEST 7: Search with dealership name containing spaces${NC}"
test_search \
    "Multi-word dealership name" \
    "$SEARCH_ENDPOINT?lat=$TEST_LAT&lng=$TEST_LNG&radius=$TEST_RADIUS&dealershipName=Aeon%20Auto%20Group" \
    "Aeon Auto Group"

# Test 8: Search with dealership name + brand + location
echo -e "${GREEN}TEST 8: Search with dealership name + brand + location${NC}"
test_search \
    "Complete search parameters" \
    "$SEARCH_ENDPOINT?location=Manila,%20Philippines&radius=$TEST_RADIUS&dealershipName=Sunset%20Toyota&brand=Toyota" \
    "Sunset Toyota Toyota dealership"

# Show logs to verify query construction
show_logs

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  TEST SUITE COMPLETED${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo -e "1. Check the backend logs above to see the actual query construction"
echo -e "2. The 'Expected Query Pattern' shows what the Google Places API query should be"
echo -e "3. Look for 'Query construction for Google Places search' in the logs"
echo -e "4. Verify that dealershipName parameter is being used correctly in query construction"
echo ""
echo -e "${BLUE}To see more detailed logs in real-time:${NC}"
echo -e "${BLUE}docker-compose logs -f backend | grep -E '(Query construction|Dealership search|Google Places)'${NC}"
echo ""