#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Timesheet & Workforce Management App
Tests all critical functionality as requested in the review.
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://workhours-14.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials from test_result.md
ADMIN_PHONE = "0457802302"
ADMIN_PIN = "1234"
SUPERVISOR_PHONE = "0412345678"
SUPERVISOR_PIN = "5678"
EMPLOYEE_PHONE = "0423456789"
EMPLOYEE_PIN = "1111"

# Test data
TEST_EMPLOYEE_ID = "6946008e4d67d45754c55f12"
TEST_SITE_ID = "6937ab02ed93a77515eb99de"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, success, message, response_data=None):
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} - {test_name}: {message}"
        self.results.append(result)
        
        if success:
            self.passed += 1
        else:
            self.failed += 1
        
        print(result)
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        for result in self.results:
            print(result)

def make_request(method, endpoint, data=None, expected_status=200):
    """Make HTTP request and return response"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=HEADERS, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, headers=HEADERS, json=data, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=HEADERS, json=data, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=HEADERS, timeout=30)
        else:
            return None, f"Unsupported method: {method}"
        
        return response, None
    except requests.exceptions.RequestException as e:
        return None, f"Request failed: {str(e)}"

def test_authentication():
    """Test authentication endpoints"""
    print(f"\n{'='*20} AUTHENTICATION TESTS {'='*20}")
    results = TestResults()
    
    # Test 1: Valid login with phone and PIN (0457802302, 1234)
    login_data = {
        "identifier": ADMIN_PHONE,
        "pin": ADMIN_PIN
    }
    
    response, error = make_request("POST", "/auth/login", login_data)
    if error:
        results.add_result("Valid Login (Admin)", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("user") and data.get("token"):
                results.add_result("Valid Login (Admin)", True, f"Login successful for {ADMIN_PHONE}")
            else:
                results.add_result("Valid Login (Admin)", False, "Missing required fields in response", data)
        else:
            results.add_result("Valid Login (Admin)", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 2: Invalid PIN
    invalid_login_data = {
        "identifier": ADMIN_PHONE,
        "pin": "9999"
    }
    
    response, error = make_request("POST", "/auth/login", invalid_login_data)
    if error:
        results.add_result("Invalid PIN", False, error)
    else:
        if response.status_code == 401:
            results.add_result("Invalid PIN", True, "Correctly rejected invalid PIN with 401")
        else:
            results.add_result("Invalid PIN", False, f"Expected 401, got {response.status_code}", response.text)
    
    return results

def test_manual_timesheet():
    """Test manual timesheet creation - CRITICAL timezone fix verification"""
    print(f"\n{'='*20} MANUAL TIMESHEET TESTS (CRITICAL) {'='*20}")
    results = TestResults()
    
    # Test manual timesheet with local datetime (no timezone)
    manual_timesheet_data = {
        "employee_id": TEST_EMPLOYEE_ID,
        "site_id": TEST_SITE_ID,
        "clock_in": "2025-12-20T08:30:00",
        "clock_out": "2025-12-20T16:30:00",
        "break_minutes": 30,
        "notes": "Test manual entry"
    }
    
    response, error = make_request("POST", "/timesheets/manual", manual_timesheet_data)
    if error:
        results.add_result("Manual Timesheet Creation", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("timesheet"):
                timesheet = data["timesheet"]
                clock_in_response = timesheet.get("clock_in")
                
                # CRITICAL: Verify timezone handling - clock_in should be preserved as-is
                if "2025-12-20T08:30:00" in str(clock_in_response):
                    results.add_result("Timezone Handling", True, "Clock-in time preserved without timezone shift")
                else:
                    results.add_result("Timezone Handling", False, f"Clock-in time shifted: expected '2025-12-20T08:30:00', got '{clock_in_response}'")
                
                # Verify total hours calculation
                total_hours = timesheet.get("total_hours")
                expected_hours = 7.5  # 8 hours minus 30 minutes break
                if abs(total_hours - expected_hours) < 0.1:
                    results.add_result("Hours Calculation", True, f"Correct total hours: {total_hours}")
                else:
                    results.add_result("Hours Calculation", False, f"Incorrect hours: expected {expected_hours}, got {total_hours}")
                
                results.add_result("Manual Timesheet Creation", True, "Manual timesheet created successfully")
            else:
                results.add_result("Manual Timesheet Creation", False, "Missing required fields in response", data)
        else:
            results.add_result("Manual Timesheet Creation", False, f"Expected 200, got {response.status_code}", response.text)
    
    return results

def test_roster_shifts():
    """Test roster shift management"""
    print(f"\n{'='*20} ROSTER SHIFT TESTS {'='*20}")
    results = TestResults()
    
    # Test 1: GET roster shifts
    response, error = make_request("GET", "/roster/shifts")
    if error:
        results.add_result("Get Roster Shifts", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.add_result("Get Roster Shifts", True, f"Retrieved {len(data)} roster shifts")
            else:
                results.add_result("Get Roster Shifts", False, "Response is not a list", data)
        else:
            results.add_result("Get Roster Shifts", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 2: POST create new shift
    new_shift_data = {
        "employee_id": TEST_EMPLOYEE_ID,
        "site_id": TEST_SITE_ID,
        "role": "Room Attendant",
        "start_time": "2025-12-25T09:00:00",
        "end_time": "2025-12-25T17:00:00",
        "notes": "Test shift creation"
    }
    
    # Add created_by parameter as required by the API
    response, error = make_request("POST", "/roster/shifts?created_by=admin_test", new_shift_data)
    created_shift_id = None
    
    if error:
        results.add_result("Create Roster Shift", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if data.get("id"):
                created_shift_id = data["id"]
                results.add_result("Create Roster Shift", True, f"Shift created with ID: {created_shift_id}")
            else:
                results.add_result("Create Roster Shift", False, "No shift ID in response", data)
        else:
            results.add_result("Create Roster Shift", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 3: DELETE roster shift (if we created one)
    if created_shift_id:
        response, error = make_request("DELETE", f"/roster/shifts/{created_shift_id}")
        if error:
            results.add_result("Delete Roster Shift", False, error)
        else:
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results.add_result("Delete Roster Shift", True, "Shift deleted successfully")
                else:
                    results.add_result("Delete Roster Shift", False, "Success flag not set", data)
            else:
                results.add_result("Delete Roster Shift", False, f"Expected 200, got {response.status_code}", response.text)
    
    return results

def test_timesheet_management():
    """Test timesheet delete functionality"""
    print(f"\n{'='*20} TIMESHEET DELETE TESTS {'='*20}")
    results = TestResults()
    
    # Test 1: GET timesheets list
    response, error = make_request("GET", "/timesheets")
    timesheet_id = None
    
    if error:
        results.add_result("Get Timesheets", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.add_result("Get Timesheets", True, f"Retrieved {len(data)} timesheets")
                if len(data) > 0:
                    timesheet_id = data[0].get("id")
            else:
                results.add_result("Get Timesheets", False, "Response is not a list", data)
        else:
            results.add_result("Get Timesheets", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 2: DELETE valid timesheet (if we have one)
    if timesheet_id:
        response, error = make_request("DELETE", f"/timesheets/{timesheet_id}")
        if error:
            results.add_result("Delete Valid Timesheet", False, error)
        else:
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results.add_result("Delete Valid Timesheet", True, "Timesheet deleted successfully")
                else:
                    results.add_result("Delete Valid Timesheet", False, "Success flag not set", data)
            else:
                results.add_result("Delete Valid Timesheet", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 3: DELETE invalid timesheet ID
    invalid_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
    response, error = make_request("DELETE", f"/timesheets/{invalid_id}")
    if error:
        results.add_result("Delete Invalid Timesheet", False, error)
    else:
        if response.status_code == 404:
            results.add_result("Delete Invalid Timesheet", True, "Correctly returned 404 for invalid ID")
        else:
            results.add_result("Delete Invalid Timesheet", False, f"Expected 404, got {response.status_code}", response.text)
    
    return results

def test_supervisor_dashboard():
    """Test supervisor dashboard"""
    print(f"\n{'='*20} SUPERVISOR DASHBOARD TESTS {'='*20}")
    results = TestResults()
    
    response, error = make_request("GET", "/dashboard/supervisor")
    if error:
        results.add_result("Supervisor Dashboard", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            required_fields = ["pending_approvals"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if not missing_fields:
                results.add_result("Supervisor Dashboard", True, f"Dashboard returned required fields: pending_approvals={data.get('pending_approvals')}")
            else:
                results.add_result("Supervisor Dashboard", False, f"Missing fields: {missing_fields}", data)
        else:
            results.add_result("Supervisor Dashboard", False, f"Expected 200, got {response.status_code}", response.text)
    
    return results

def test_user_management():
    """Test user management endpoints"""
    print(f"\n{'='*20} USER MANAGEMENT TESTS {'='*20}")
    results = TestResults()
    
    # Test 1: GET users list
    response, error = make_request("GET", "/users")
    if error:
        results.add_result("Get Users", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.add_result("Get Users", True, f"Retrieved {len(data)} users")
            else:
                results.add_result("Get Users", False, "Response is not a list", data)
        else:
            results.add_result("Get Users", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 2: POST create new user
    timestamp = datetime.now().strftime('%H%M%S')
    new_user_data = {
        "first_name": "Test",
        "last_name": "Employee",
        "phone": f"04{timestamp}999",  # Unique phone
        "email": f"test{timestamp}@test.com",
        "role": "employee",
        "job_title": "Room Attendant",
        "site_id": TEST_SITE_ID,
        "pin": "1234"
    }
    
    response, error = make_request("POST", "/users", new_user_data)
    created_user_id = None
    
    if error:
        results.add_result("Create User", False, error)
    else:
        if response.status_code == 200:
            data = response.json()
            if data.get("id"):
                created_user_id = data["id"]
                results.add_result("Create User", True, f"User created with ID: {created_user_id}")
            else:
                results.add_result("Create User", False, "No user ID in response", data)
        else:
            results.add_result("Create User", False, f"Expected 200, got {response.status_code}", response.text)
    
    # Test 3: PUT update user permissions (if we created one)
    if created_user_id:
        update_data = {
            "permissions": {
                "view_home": True,
                "view_own_timesheets": True,
                "clock_in_out": True,
                "view_roster": True
            }
        }
        
        response, error = make_request("PUT", f"/users/{created_user_id}", update_data)
        if error:
            results.add_result("Update User Permissions", False, error)
        else:
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results.add_result("Update User Permissions", True, "User permissions updated successfully")
                else:
                    results.add_result("Update User Permissions", False, "Success flag not set", data)
            else:
                results.add_result("Update User Permissions", False, f"Expected 200, got {response.status_code}", response.text)
    
    return results

def main():
    """Run all tests"""
    print("🚀 Starting Comprehensive Backend API Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_results = TestResults()
    
    # Run all test suites
    test_suites = [
        ("Authentication", test_authentication),
        ("Manual Timesheet (CRITICAL)", test_manual_timesheet),
        ("Roster Shifts", test_roster_shifts),
        ("Timesheet Management", test_timesheet_management),
        ("Supervisor Dashboard", test_supervisor_dashboard),
        ("User Management", test_user_management)
    ]
    
    for suite_name, test_func in test_suites:
        try:
            suite_results = test_func()
            all_results.passed += suite_results.passed
            all_results.failed += suite_results.failed
            all_results.results.extend(suite_results.results)
        except Exception as e:
            error_msg = f"❌ FAIL - {suite_name}: Test suite crashed - {str(e)}"
            all_results.results.append(error_msg)
            all_results.failed += 1
            print(error_msg)
    
    # Print final summary
    all_results.summary()
    
    # Return exit code based on results
    if all_results.failed > 0:
        print(f"\n⚠️  {all_results.failed} test(s) failed!")
        return 1
    else:
        print(f"\n🎉 All {all_results.passed} tests passed!")
        return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)