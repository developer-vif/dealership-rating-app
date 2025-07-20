# Dealership Search API Test Documentation

## Overview

This document describes the test scripts created to verify the dealership name search functionality after the recent bug fix. The tests verify that the query construction logic in the Google Places Service is working correctly.

## Test Scripts

### 1. `test_dealership_search.sh` - Comprehensive Test Suite

**Purpose**: Complete testing of all search scenarios with detailed response analysis.

**Features**:
- Tests 8 different search scenarios
- Validates HTTP responses and JSON structure
- Shows sample results from each search
- Displays backend logs for query construction verification
- Includes service health check

**Usage**:
```bash
./test_dealership_search.sh
```

### 2. `test_query_construction.sh` - Query Construction Focus

**Purpose**: Simplified test focusing specifically on query construction verification.

**Features**:
- Tests 5 key search scenarios
- Shows expected vs actual query construction
- Extracts relevant log entries for verification
- Quick verification of the bug fix

**Usage**:
```bash
./test_query_construction.sh
```

## Test Scenarios Covered

### Scenario 1: Dealership Name Only
- **Parameter**: `dealershipName=Toyota`
- **Expected Query**: `"Toyota"`
- **Bug Fix Verification**: Ensures dealership name is used as primary query when provided

### Scenario 2: Dealership Name + Brand
- **Parameter**: `dealershipName=Ford%20Makati&brand=Ford`
- **Expected Query**: `"Ford Makati Ford dealership"`
- **Bug Fix Verification**: Confirms proper combination of dealership name and brand

### Scenario 3: Dealership Name + Location
- **Parameter**: `location=Quezon%20City&dealershipName=Honda`
- **Expected Query**: `"Honda"`
- **Bug Fix Verification**: Tests dealership name with location-based search

### Scenario 4: Complex Dealership Names
- **Parameter**: `dealershipName=Car%20Empire%20Flagship`
- **Expected Query**: `"Car Empire Flagship"`
- **Bug Fix Verification**: Handles multi-word dealership names correctly

### Scenario 5: Brand Only (Comparison)
- **Parameter**: `brand=Toyota`
- **Expected Query**: `"Toyota dealership"`
- **Bug Fix Verification**: Confirms existing brand-only functionality still works

### Scenario 6: Default Search (Comparison)
- **Parameter**: _(none)_
- **Expected Query**: `"car dealership OR motorcycle dealership"`
- **Bug Fix Verification**: Confirms default behavior when no specific parameters provided

## Query Construction Logic

Based on the code analysis, the query construction logic in `googlePlacesService.ts` (lines 140-150) follows this pattern:

```javascript
let query = 'car dealership OR motorcycle dealership';
if (params.dealershipName) {
    // If dealership name is provided, use it as the primary query
    if (params.brand) {
        query = `${params.dealershipName} ${params.brand} dealership`;
    } else {
        query = params.dealershipName;
    }
} else if (params.brand) {
    query = `${params.brand} dealership`;
}
```

## How to Run the Tests

### Prerequisites
1. Backend service must be running:
   ```bash
   docker-compose up -d
   ```

2. Verify service health:
   ```bash
   curl http://localhost:3002/health
   ```

### Running Tests

#### Option 1: Full Test Suite
```bash
# Run comprehensive tests
./test_dealership_search.sh
```

#### Option 2: Quick Query Verification
```bash
# Run focused query construction tests
./test_query_construction.sh
```

#### Option 3: Manual Testing
```bash
# Test specific scenario manually
curl "http://localhost:3002/api/dealerships/search?lat=14.5995&lng=120.9842&radius=10&dealershipName=Toyota"

# Check logs for query construction
docker-compose logs backend | grep "Query construction" | tail -5
```

## Expected Log Output

When the dealership name search is working correctly, you should see logs like:

```
Query construction for Google Places search {
  dealershipName: 'Toyota',
  brand: undefined,
  constructedQuery: 'Toyota',
  dealershipNameExists: true,
  brandExists: false
}
```

For dealership name + brand:
```
Query construction for Google Places search {
  dealershipName: 'Ford Makati',
  brand: 'Ford',
  constructedQuery: 'Ford Makati Ford dealership',
  dealershipNameExists: true,
  brandExists: true
}
```

## Verification Points

### ✅ Bug Fix Success Indicators:

1. **Query Construction**: `dealershipName` parameter properly influences the search query
2. **Primary Query Use**: When `dealershipName` is provided, it becomes the primary search term (not appended to default)
3. **Brand Combination**: When both `dealershipName` and `brand` are provided, they combine correctly
4. **Log Visibility**: Query construction is logged with all relevant parameters
5. **API Response**: Valid JSON responses with appropriate dealership results

### ❌ Bug Indicators:

1. Query always defaults to "car dealership OR motorcycle dealership" regardless of `dealershipName`
2. `dealershipName` parameter is ignored in query construction
3. No relevant results when searching for specific dealership names
4. Missing or incorrect query construction logs

## Debugging

### View Real-time Logs
```bash
# Monitor query construction in real-time
docker-compose logs -f backend | grep -E "(Query construction|Dealership search|Google Places)"
```

### Check Specific Log Entries
```bash
# View recent query construction logs
docker-compose logs backend | grep "Query construction" | tail -10
```

### Manual API Testing
```bash
# Test with different parameters
curl -v "http://localhost:3002/api/dealerships/search?lat=14.5995&lng=120.9842&dealershipName=Honda"
```

## Test Results Interpretation

- **200 OK**: API endpoint is working
- **Valid JSON Response**: Service properly processes parameters
- **Non-empty Results**: Google Places API returns relevant dealerships
- **Correct Query Logs**: Backend properly constructs search queries
- **Expected Dealerships**: Results match the search intent

## Troubleshooting

### Service Not Running
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### No Results Returned
- Check if Google Maps API key is valid
- Verify location parameters (lat/lng) are correct
- Confirm dealership name exists in the search area

### Query Construction Not Visible
- Ensure log level includes INFO messages
- Check if backend container is running properly
- Verify the logger configuration in the backend

## Summary

These test scripts comprehensively verify that the dealership name search functionality is working correctly after the bug fix. The tests confirm that:

1. The `dealershipName` parameter is properly used in query construction
2. Different parameter combinations work as expected
3. The search results are relevant to the specified dealership names
4. The backend logs properly show the query construction process

Run these tests after any changes to the search functionality to ensure the dealership name search continues to work correctly.