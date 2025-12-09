#!/usr/bin/env python3
"""
Supreme Hospitality Timesheet Management Backend API Tests
Tests all backend APIs with real test accounts and scenarios
"""

import requests
import json
from datetime import datetime
import time

# Configuration
BASE_URL = "https://hospitime.preview.emergentagent.com/api"

# Test accounts from seed data
TEST_ACCOUNTS = {
    "admin": {
        "phone": "0457802302",
        "email": "info@supremehospitalityservices.com.au", 
        "pin": "1234"
    },
    "supervisor": {
        "phone": "0412345678",
        "email": "sarah@supremehospitalityservices.com.au",
        "pin": "5678"
    },
    "emma": {
        "phone": "0423456789", 
        "email": "emma.j@example.com",
        "pin": "1111"
    },
    "michael": {
        "phone": "0434567890",
        "email": "michael.b@example.com", 
        "pin": "2222"
    },
    "lisa": {
        "phone": "0445678901",
        "email": "lisa.d@example.com",
        "pin": "3333"
    }
}

# GPS coordinates for testing (Brisbane area)
TEST_GPS = {
    "lat": -27.4698,
    "long": 153.0251
}

class TestResults:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        
    def add_result(self, test_name, success, details=""):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        if not success:
            self.failed_tests.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def print_summary(self):
        total = len(self.results)
        passed = total - len(self.failed_tests)
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {passed}/{total} tests passed")
        print(f"{'='*60}")
        
        if self.failed_tests:
            print("\nFAILED TESTS:")
            for test in self.failed_tests:
                print(f"❌ {test['test']}: {test['details']}")

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_authentication():
    """Test authentication API with various scenarios"""
    results = TestResults()
    
    print("\n🔐 TESTING AUTHENTICATION API")
    print("-" * 40)
    
    # Test 1: Valid login with phone number
    response = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": TEST_ACCOUNTS["emma"]["pin"]
    })
    
    if response and response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("user") and data.get("token"):
            results.add_result("Login with phone number", True, f"User ID: {data['user'].get('id')}")
        else:
            results.add_result("Login with phone number", False, "Missing required fields in response")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Login with phone number", False, f"HTTP {status}")
    
    # Test 2: Valid login with email
    response = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["supervisor"]["email"],
        "pin": TEST_ACCOUNTS["supervisor"]["pin"]
    })
    
    if response and response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("user") and data.get("token"):
            results.add_result("Login with email", True, f"User: {data['user'].get('first_name')}")
        else:
            results.add_result("Login with email", False, "Missing required fields in response")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Login with email", False, f"HTTP {status}")
    
    # Test 3: Invalid PIN
    response = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": "9999"
    })
    
    if response and response.status_code == 401:
        results.add_result("Invalid PIN rejection", True, "Correctly rejected invalid PIN")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Invalid PIN rejection", False, f"Expected 401, got {status}")
    
    # Test 4: Non-existent user
    response = make_request("POST", "/auth/login", {
        "identifier": "0999999999",
        "pin": "1234"
    })
    
    if response and response.status_code == 404:
        results.add_result("Non-existent user rejection", True, "Correctly rejected unknown user")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Non-existent user rejection", False, f"Expected 404, got {status}")
    
    return results

def test_user_apis():
    """Test user management APIs"""
    results = TestResults()
    
    print("\n👥 TESTING USER APIS")
    print("-" * 40)
    
    # Test 1: Get all users
    response = make_request("GET", "/users")
    
    if response and response.status_code == 200:
        users = response.json()
        if isinstance(users, list) and len(users) >= 5:
            results.add_result("Get all users", True, f"Found {len(users)} users")
        else:
            results.add_result("Get all users", False, f"Expected list with >=5 users, got {len(users) if isinstance(users, list) else 'not a list'}")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Get all users", False, f"HTTP {status}")
    
    # Test 2: Get users by role (employees)
    response = make_request("GET", "/users?role=employee")
    
    if response and response.status_code == 200:
        employees = response.json()
        if isinstance(employees, list) and len(employees) >= 3:
            results.add_result("Get employees by role", True, f"Found {len(employees)} employees")
        else:
            results.add_result("Get employees by role", False, f"Expected >=3 employees, got {len(employees) if isinstance(employees, list) else 'not a list'}")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Get employees by role", False, f"HTTP {status}")
    
    # Test 3: Get users by role (supervisors)
    response = make_request("GET", "/users?role=supervisor")
    
    if response and response.status_code == 200:
        supervisors = response.json()
        if isinstance(supervisors, list) and len(supervisors) >= 1:
            results.add_result("Get supervisors by role", True, f"Found {len(supervisors)} supervisors")
        else:
            results.add_result("Get supervisors by role", False, f"Expected >=1 supervisors, got {len(supervisors) if isinstance(supervisors, list) else 'not a list'}")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Get supervisors by role", False, f"HTTP {status}")
    
    return results

def test_site_apis():
    """Test site management APIs"""
    results = TestResults()
    
    print("\n🏢 TESTING SITE APIS")
    print("-" * 40)
    
    # Test 1: Get all sites
    response = make_request("GET", "/sites")
    
    if response and response.status_code == 200:
        sites = response.json()
        if isinstance(sites, list) and len(sites) >= 3:
            results.add_result("Get all sites", True, f"Found {len(sites)} sites")
            # Store first site ID for later tests
            global test_site_id
            test_site_id = sites[0].get("id") if sites else None
        else:
            results.add_result("Get all sites", False, f"Expected >=3 sites, got {len(sites) if isinstance(sites, list) else 'not a list'}")
    else:
        status = response.status_code if response else "No response"
        results.add_result("Get all sites", False, f"HTTP {status}")
    
    return results

def test_clock_in_out_flow():
    """Test complete clock-in/clock-out workflow"""
    results = TestResults()
    
    print("\n⏰ TESTING CLOCK-IN/OUT FLOW")
    print("-" * 40)
    
    # First get Emma's user ID
    login_response = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": TEST_ACCOUNTS["emma"]["pin"]
    })
    
    if not login_response or login_response.status_code != 200:
        results.add_result("Clock-in/out setup", False, "Could not login to get user ID")
        return results
    
    emma_user = login_response.json()["user"]
    emma_id = emma_user["id"]
    
    # Get a site ID
    sites_response = make_request("GET", "/sites")
    if not sites_response or sites_response.status_code != 200:
        results.add_result("Clock-in/out setup", False, "Could not get sites")
        return results
    
    sites = sites_response.json()
    if not sites:
        results.add_result("Clock-in/out setup", False, "No sites available")
        return results
    
    site_id = sites[0]["id"]
    
    # Test 1: Clock in
    clock_in_response = make_request("POST", "/timesheets/clock-in", {
        "employee_id": emma_id,
        "site_id": site_id,
        "gps_lat": TEST_GPS["lat"],
        "gps_long": TEST_GPS["long"]
    })
    
    timesheet_id = None
    if clock_in_response and clock_in_response.status_code == 200:
        data = clock_in_response.json()
        if data.get("success") and data.get("timesheet"):
            timesheet_id = data["timesheet"]["id"]
            results.add_result("Clock in", True, f"Timesheet ID: {timesheet_id}")
        else:
            results.add_result("Clock in", False, "Missing success or timesheet in response")
    else:
        status = clock_in_response.status_code if clock_in_response else "No response"
        results.add_result("Clock in", False, f"HTTP {status}")
    
    if not timesheet_id:
        results.add_result("Clock-in/out flow", False, "Cannot continue without timesheet ID")
        return results
    
    # Test 2: Try to clock in again (should fail)
    double_clock_in = make_request("POST", "/timesheets/clock-in", {
        "employee_id": emma_id,
        "site_id": site_id,
        "gps_lat": TEST_GPS["lat"],
        "gps_long": TEST_GPS["long"]
    })
    
    if double_clock_in and double_clock_in.status_code == 400:
        results.add_result("Prevent double clock-in", True, "Correctly prevented double clock-in")
    else:
        status = double_clock_in.status_code if double_clock_in else "No response"
        results.add_result("Prevent double clock-in", False, f"Expected 400, got {status}")
    
    # Wait a moment for time calculation
    time.sleep(2)
    
    # Test 3: Clock out
    clock_out_response = make_request("POST", "/timesheets/clock-out", {
        "timesheet_id": timesheet_id,
        "gps_lat": TEST_GPS["lat"],
        "gps_long": TEST_GPS["long"]
    })
    
    if clock_out_response and clock_out_response.status_code == 200:
        data = clock_out_response.json()
        if data.get("success") and data.get("timesheet"):
            timesheet = data["timesheet"]
            total_hours = timesheet.get("total_hours", 0)
            results.add_result("Clock out", True, f"Total hours: {total_hours}")
        else:
            results.add_result("Clock out", False, "Missing success or timesheet in response")
    else:
        status = clock_out_response.status_code if clock_out_response else "No response"
        results.add_result("Clock out", False, f"HTTP {status}")
    
    # Test 4: Try to clock out without being clocked in (using Michael)
    michael_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["michael"]["phone"],
        "pin": TEST_ACCOUNTS["michael"]["pin"]
    })
    
    if michael_login and michael_login.status_code == 200:
        michael_id = michael_login.json()["user"]["id"]
        
        # Try to clock out without clocking in (should fail)
        invalid_clock_out = make_request("POST", "/timesheets/clock-out", {
            "timesheet_id": "invalid_id",
            "gps_lat": TEST_GPS["lat"],
            "gps_long": TEST_GPS["long"]
        })
        
        if invalid_clock_out and invalid_clock_out.status_code == 404:
            results.add_result("Clock out without clock in", True, "Correctly rejected invalid timesheet")
        else:
            status = invalid_clock_out.status_code if invalid_clock_out else "No response"
            results.add_result("Clock out without clock in", False, f"Expected 404, got {status}")
    
    return results

def test_break_management():
    """Test break start/end functionality"""
    results = TestResults()
    
    print("\n☕ TESTING BREAK MANAGEMENT")
    print("-" * 40)
    
    # First clock in Lisa
    login_response = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["lisa"]["phone"],
        "pin": TEST_ACCOUNTS["lisa"]["pin"]
    })
    
    if not login_response or login_response.status_code != 200:
        results.add_result("Break management setup", False, "Could not login")
        return results
    
    lisa_id = login_response.json()["user"]["id"]
    
    # Get a site
    sites_response = make_request("GET", "/sites")
    if not sites_response or sites_response.status_code != 200:
        results.add_result("Break management setup", False, "Could not get sites")
        return results
    
    site_id = sites_response.json()[0]["id"]
    
    # Clock in first
    clock_in_response = make_request("POST", "/timesheets/clock-in", {
        "employee_id": lisa_id,
        "site_id": site_id,
        "gps_lat": TEST_GPS["lat"],
        "gps_long": TEST_GPS["long"]
    })
    
    if not clock_in_response or clock_in_response.status_code != 200:
        results.add_result("Break management setup", False, "Could not clock in")
        return results
    
    timesheet_id = clock_in_response.json()["timesheet"]["id"]
    
    # Test 1: Start break
    start_break_response = make_request("POST", "/timesheets/break", {
        "timesheet_id": timesheet_id,
        "action": "start"
    })
    
    if start_break_response and start_break_response.status_code == 200:
        data = start_break_response.json()
        if data.get("success"):
            results.add_result("Start break", True, "Break started successfully")
        else:
            results.add_result("Start break", False, "Success flag not set")
    else:
        status = start_break_response.status_code if start_break_response else "No response"
        results.add_result("Start break", False, f"HTTP {status}")
    
    # Test 2: Try to start break again (should fail)
    double_break_response = make_request("POST", "/timesheets/break", {
        "timesheet_id": timesheet_id,
        "action": "start"
    })
    
    if double_break_response and double_break_response.status_code == 400:
        results.add_result("Prevent double break start", True, "Correctly prevented double break start")
    else:
        status = double_break_response.status_code if double_break_response else "No response"
        results.add_result("Prevent double break start", False, f"Expected 400, got {status}")
    
    # Wait a moment for break duration
    time.sleep(2)
    
    # Test 3: End break
    end_break_response = make_request("POST", "/timesheets/break", {
        "timesheet_id": timesheet_id,
        "action": "end"
    })
    
    if end_break_response and end_break_response.status_code == 200:
        data = end_break_response.json()
        if data.get("success") and data.get("timesheet"):
            break_minutes = data["timesheet"].get("break_minutes", 0)
            results.add_result("End break", True, f"Break minutes: {break_minutes}")
        else:
            results.add_result("End break", False, "Missing success or timesheet in response")
    else:
        status = end_break_response.status_code if end_break_response else "No response"
        results.add_result("End break", False, f"HTTP {status}")
    
    # Test 4: Try to end break without starting (using different timesheet)
    michael_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["michael"]["phone"],
        "pin": TEST_ACCOUNTS["michael"]["pin"]
    })
    
    if michael_login and michael_login.status_code == 200:
        michael_id = michael_login.json()["user"]["id"]
        
        # Clock in Michael
        michael_clock_in = make_request("POST", "/timesheets/clock-in", {
            "employee_id": michael_id,
            "site_id": site_id,
            "gps_lat": TEST_GPS["lat"],
            "gps_long": TEST_GPS["long"]
        })
        
        if michael_clock_in and michael_clock_in.status_code == 200:
            michael_timesheet_id = michael_clock_in.json()["timesheet"]["id"]
            
            # Try to end break without starting
            invalid_end_break = make_request("POST", "/timesheets/break", {
                "timesheet_id": michael_timesheet_id,
                "action": "end"
            })
            
            if invalid_end_break and invalid_end_break.status_code == 400:
                results.add_result("End break without start", True, "Correctly rejected ending non-existent break")
            else:
                status = invalid_end_break.status_code if invalid_end_break else "No response"
                results.add_result("End break without start", False, f"Expected 400, got {status}")
    
    return results

def test_timesheet_approval():
    """Test timesheet approval workflow"""
    results = TestResults()
    
    print("\n✅ TESTING TIMESHEET APPROVAL")
    print("-" * 40)
    
    # Get supervisor ID
    supervisor_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["supervisor"]["phone"],
        "pin": TEST_ACCOUNTS["supervisor"]["pin"]
    })
    
    if not supervisor_login or supervisor_login.status_code != 200:
        results.add_result("Approval workflow setup", False, "Could not login supervisor")
        return results
    
    supervisor_id = supervisor_login.json()["user"]["id"]
    
    # Test 1: Get pending timesheets
    pending_response = make_request("GET", "/timesheets?approval_status=pending")
    
    if pending_response and pending_response.status_code == 200:
        pending_timesheets = pending_response.json()
        if isinstance(pending_timesheets, list):
            results.add_result("Get pending timesheets", True, f"Found {len(pending_timesheets)} pending timesheets")
            
            if len(pending_timesheets) > 0:
                # Test 2: Approve a timesheet
                timesheet_to_approve = pending_timesheets[0]
                approve_response = make_request("POST", "/timesheets/approve", {
                    "timesheet_id": timesheet_to_approve["id"],
                    "supervisor_id": supervisor_id,
                    "status": "approved",
                    "notes": "Good work, approved by supervisor"
                })
                
                if approve_response and approve_response.status_code == 200:
                    data = approve_response.json()
                    if data.get("success") and data.get("timesheet"):
                        approved_timesheet = data["timesheet"]
                        if approved_timesheet.get("approval_status") == "approved":
                            results.add_result("Approve timesheet", True, f"Timesheet approved with notes")
                        else:
                            results.add_result("Approve timesheet", False, "Status not updated to approved")
                    else:
                        results.add_result("Approve timesheet", False, "Missing success or timesheet in response")
                else:
                    status = approve_response.status_code if approve_response else "No response"
                    results.add_result("Approve timesheet", False, f"HTTP {status}")
                
                # Test 3: Reject a timesheet (if we have more than one)
                if len(pending_timesheets) > 1:
                    timesheet_to_reject = pending_timesheets[1]
                    reject_response = make_request("POST", "/timesheets/approve", {
                        "timesheet_id": timesheet_to_reject["id"],
                        "supervisor_id": supervisor_id,
                        "status": "rejected",
                        "notes": "Please check your clock-in time"
                    })
                    
                    if reject_response and reject_response.status_code == 200:
                        data = reject_response.json()
                        if data.get("success") and data.get("timesheet"):
                            rejected_timesheet = data["timesheet"]
                            if rejected_timesheet.get("approval_status") == "rejected":
                                results.add_result("Reject timesheet", True, f"Timesheet rejected with notes")
                            else:
                                results.add_result("Reject timesheet", False, "Status not updated to rejected")
                        else:
                            results.add_result("Reject timesheet", False, "Missing success or timesheet in response")
                    else:
                        status = reject_response.status_code if reject_response else "No response"
                        results.add_result("Reject timesheet", False, f"HTTP {status}")
            else:
                results.add_result("Timesheet approval tests", False, "No pending timesheets to test approval workflow")
        else:
            results.add_result("Get pending timesheets", False, "Response is not a list")
    else:
        status = pending_response.status_code if pending_response else "No response"
        results.add_result("Get pending timesheets", False, f"HTTP {status}")
    
    return results

def test_supervisor_dashboard():
    """Test supervisor dashboard API"""
    results = TestResults()
    
    print("\n📊 TESTING SUPERVISOR DASHBOARD")
    print("-" * 40)
    
    # Test 1: Get dashboard data without site filter
    dashboard_response = make_request("GET", "/dashboard/supervisor")
    
    if dashboard_response and dashboard_response.status_code == 200:
        data = dashboard_response.json()
        required_fields = ["active_employees", "pending_approvals", "active_timesheets", "pending_timesheets"]
        
        if all(field in data for field in required_fields):
            results.add_result("Supervisor dashboard", True, 
                f"Active: {data['active_employees']}, Pending: {data['pending_approvals']}")
        else:
            missing = [f for f in required_fields if f not in data]
            results.add_result("Supervisor dashboard", False, f"Missing fields: {missing}")
    else:
        status = dashboard_response.status_code if dashboard_response else "No response"
        results.add_result("Supervisor dashboard", False, f"HTTP {status}")
    
    # Test 2: Get dashboard data with site filter
    sites_response = make_request("GET", "/sites")
    if sites_response and sites_response.status_code == 200:
        sites = sites_response.json()
        if sites:
            site_id = sites[0]["id"]
            filtered_dashboard = make_request("GET", f"/dashboard/supervisor?site_id={site_id}")
            
            if filtered_dashboard and filtered_dashboard.status_code == 200:
                data = filtered_dashboard.json()
                required_fields = ["active_employees", "pending_approvals", "active_timesheets", "pending_timesheets"]
                
                if all(field in data for field in required_fields):
                    results.add_result("Dashboard with site filter", True, 
                        f"Site filtered - Active: {data['active_employees']}, Pending: {data['pending_approvals']}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    results.add_result("Dashboard with site filter", False, f"Missing fields: {missing}")
            else:
                status = filtered_dashboard.status_code if filtered_dashboard else "No response"
                results.add_result("Dashboard with site filter", False, f"HTTP {status}")
    
    return results

def main():
    """Run all backend API tests"""
    print("🚀 SUPREME HOSPITALITY TIMESHEET BACKEND API TESTS")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().isoformat()}")
    
    all_results = TestResults()
    
    # Run all test suites
    test_suites = [
        ("Authentication API", test_authentication),
        ("User APIs", test_user_apis),
        ("Site APIs", test_site_apis),
        ("Clock-in/out Flow", test_clock_in_out_flow),
        ("Break Management", test_break_management),
        ("Timesheet Approval", test_timesheet_approval),
        ("Supervisor Dashboard", test_supervisor_dashboard)
    ]
    
    for suite_name, test_func in test_suites:
        try:
            suite_results = test_func()
            all_results.results.extend(suite_results.results)
            all_results.failed_tests.extend(suite_results.failed_tests)
        except Exception as e:
            print(f"\n❌ ERROR in {suite_name}: {str(e)}")
            all_results.add_result(f"{suite_name} (Exception)", False, str(e))
    
    # Print final summary
    all_results.print_summary()
    
    print(f"\nTest completed at: {datetime.now().isoformat()}")
    
    return all_results

if __name__ == "__main__":
    results = main()