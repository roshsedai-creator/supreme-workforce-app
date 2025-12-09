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
BASE_URL = "https://timeclock-20.preview.emergentagent.com/api"

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
            response = requests.get(url, headers=headers, timeout=15)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=15)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.Timeout:
        print(f"Request timeout for {method} {endpoint}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {method} {endpoint}: {e}")
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

def test_roster_management():
    """Test roster shift management APIs"""
    results = TestResults()
    
    print("\n📅 TESTING ROSTER MANAGEMENT")
    print("-" * 40)
    
    # Get admin and employee IDs
    admin_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["admin"]["phone"],
        "pin": TEST_ACCOUNTS["admin"]["pin"]
    })
    
    emma_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": TEST_ACCOUNTS["emma"]["pin"]
    })
    
    if not admin_login or admin_login.status_code != 200:
        results.add_result("Roster management setup", False, "Could not login admin")
        return results
    
    if not emma_login or emma_login.status_code != 200:
        results.add_result("Roster management setup", False, "Could not login Emma")
        return results
    
    admin_id = admin_login.json()["user"]["id"]
    emma_id = emma_login.json()["user"]["id"]
    
    # Get sites
    sites_response = make_request("GET", "/sites")
    if not sites_response or sites_response.status_code != 200:
        results.add_result("Roster management setup", False, "Could not get sites")
        return results
    
    sites = sites_response.json()
    if not sites:
        results.add_result("Roster management setup", False, "No sites available")
        return results
    
    site_id = sites[0]["id"]
    
    # Test 1: Get all roster shifts
    roster_response = make_request("GET", "/roster/shifts")
    
    if roster_response and roster_response.status_code == 200:
        shifts = roster_response.json()
        if isinstance(shifts, list):
            results.add_result("Get all roster shifts", True, f"Found {len(shifts)} roster shifts")
            
            # Check enrichment
            if shifts and "employee_name" in shifts[0] and "site_name" in shifts[0]:
                results.add_result("Roster shift enrichment", True, 
                    f"Shifts enriched with employee_name and site_name")
            elif shifts:
                results.add_result("Roster shift enrichment", False, 
                    "Shifts missing employee_name or site_name enrichment")
        else:
            results.add_result("Get all roster shifts", False, "Response is not a list")
    else:
        status = roster_response.status_code if roster_response else "No response"
        results.add_result("Get all roster shifts", False, f"HTTP {status}")
    
    # Test 2: Create a new roster shift
    from datetime import datetime, timedelta
    tomorrow = datetime.now() + timedelta(days=1)
    start_time = tomorrow.replace(hour=8, minute=0, second=0, microsecond=0)
    end_time = tomorrow.replace(hour=16, minute=0, second=0, microsecond=0)
    
    shift_data = {
        "employee_id": emma_id,
        "site_id": site_id,
        "role": "Room Attendant",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "notes": "Test shift created by backend testing"
    }
    
    create_response = make_request("POST", f"/roster/shifts?created_by={admin_id}", shift_data)
    
    test_shift_id = None
    if create_response and create_response.status_code == 200:
        shift = create_response.json()
        test_shift_id = shift.get("id")
        results.add_result("Create roster shift", True, f"Created shift ID: {test_shift_id}")
    else:
        status = create_response.status_code if create_response else "No response"
        results.add_result("Create roster shift", False, f"HTTP {status}")
    
    # Test 3: Update the roster shift
    if test_shift_id:
        new_end_time = tomorrow.replace(hour=17, minute=0, second=0, microsecond=0)
        update_data = {
            "end_time": new_end_time.isoformat(),
            "notes": "Updated by backend testing - extended to 5pm"
        }
        
        update_response = make_request("PUT", f"/roster/shifts/{test_shift_id}", update_data)
        
        if update_response and update_response.status_code == 200:
            results.add_result("Update roster shift", True, "Shift updated successfully")
        else:
            status = update_response.status_code if update_response else "No response"
            results.add_result("Update roster shift", False, f"HTTP {status}")
    
    # Test 4: Filter shifts by employee
    filter_response = make_request("GET", f"/roster/shifts?employee_id={emma_id}")
    
    if filter_response and filter_response.status_code == 200:
        emma_shifts = filter_response.json()
        if isinstance(emma_shifts, list):
            results.add_result("Filter shifts by employee", True, f"Found {len(emma_shifts)} shifts for Emma")
        else:
            results.add_result("Filter shifts by employee", False, "Response is not a list")
    else:
        status = filter_response.status_code if filter_response else "No response"
        results.add_result("Filter shifts by employee", False, f"HTTP {status}")
    
    # Test 5: Delete the test shift
    if test_shift_id:
        delete_response = make_request("DELETE", f"/roster/shifts/{test_shift_id}")
        
        if delete_response and delete_response.status_code == 200:
            results.add_result("Delete roster shift", True, "Test shift deleted successfully")
        else:
            status = delete_response.status_code if delete_response else "No response"
            results.add_result("Delete roster shift", False, f"HTTP {status}")
    
    return results

def test_availability_management():
    """Test employee availability management APIs"""
    results = TestResults()
    
    print("\n🗓️ TESTING AVAILABILITY MANAGEMENT")
    print("-" * 40)
    
    # Get Emma's ID
    emma_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": TEST_ACCOUNTS["emma"]["pin"]
    })
    
    if not emma_login or emma_login.status_code != 200:
        results.add_result("Availability management setup", False, "Could not login Emma")
        return results
    
    emma_id = emma_login.json()["user"]["id"]
    
    # Test 1: Get Emma's current availability
    get_availability_response = make_request("GET", f"/availability/{emma_id}")
    
    if get_availability_response and get_availability_response.status_code == 200:
        availability = get_availability_response.json()
        if isinstance(availability, list):
            results.add_result("Get employee availability", True, f"Found {len(availability)} availability records")
        else:
            results.add_result("Get employee availability", False, "Response is not a list")
    else:
        status = get_availability_response.status_code if get_availability_response else "No response"
        results.add_result("Get employee availability", False, f"HTTP {status}")
    
    # Test 2: Update Emma's availability
    availability_data = {
        "employee_id": emma_id,
        "availability": [
            {"day": 0, "available": False},  # Monday - unavailable
            {"day": 1, "available": True, "start_time": "09:00", "end_time": "17:00"},  # Tuesday
            {"day": 2, "available": True, "start_time": "09:00", "end_time": "17:00"},  # Wednesday
            {"day": 3, "available": True, "start_time": "09:00", "end_time": "17:00"},  # Thursday
            {"day": 4, "available": True, "start_time": "09:00", "end_time": "17:00"},  # Friday
            {"day": 5, "available": False},  # Saturday - unavailable
            {"day": 6, "available": False}   # Sunday - unavailable
        ]
    }
    
    update_availability_response = make_request("POST", "/availability", availability_data)
    
    if update_availability_response and update_availability_response.status_code == 200:
        results.add_result("Update employee availability", True, "Availability updated successfully")
    else:
        status = update_availability_response.status_code if update_availability_response else "No response"
        results.add_result("Update employee availability", False, f"HTTP {status}")
    
    # Test 3: Add unavailable date
    from datetime import datetime, timedelta
    unavailable_date = datetime.now() + timedelta(days=14)
    
    unavailable_data = {
        "employee_id": emma_id,
        "date": unavailable_date.isoformat(),
        "reason": "Personal appointment - backend testing"
    }
    
    add_unavailable_response = make_request("POST", "/availability/unavailable-dates", unavailable_data)
    
    test_unavailable_id = None
    if add_unavailable_response and add_unavailable_response.status_code == 200:
        unavailable_result = add_unavailable_response.json()
        test_unavailable_id = unavailable_result.get("id")
        results.add_result("Add unavailable date", True, f"Added unavailable date ID: {test_unavailable_id}")
    else:
        status = add_unavailable_response.status_code if add_unavailable_response else "No response"
        results.add_result("Add unavailable date", False, f"HTTP {status}")
    
    # Test 4: Get unavailable dates
    get_unavailable_response = make_request("GET", f"/availability/unavailable-dates/{emma_id}")
    
    if get_unavailable_response and get_unavailable_response.status_code == 200:
        unavailable_dates = get_unavailable_response.json()
        if isinstance(unavailable_dates, list):
            results.add_result("Get unavailable dates", True, f"Found {len(unavailable_dates)} unavailable dates")
        else:
            results.add_result("Get unavailable dates", False, "Response is not a list")
    else:
        status = get_unavailable_response.status_code if get_unavailable_response else "No response"
        results.add_result("Get unavailable dates", False, f"HTTP {status}")
    
    # Test 5: Delete unavailable date
    if test_unavailable_id:
        delete_unavailable_response = make_request("DELETE", f"/availability/unavailable-dates/{test_unavailable_id}")
        
        if delete_unavailable_response and delete_unavailable_response.status_code == 200:
            results.add_result("Delete unavailable date", True, "Unavailable date deleted successfully")
        else:
            status = delete_unavailable_response.status_code if delete_unavailable_response else "No response"
            results.add_result("Delete unavailable date", False, f"HTTP {status}")
    
    return results

def test_clock_in_roster_validation():
    """Test clock-in with roster validation"""
    results = TestResults()
    
    print("\n🔒 TESTING CLOCK-IN ROSTER VALIDATION")
    print("-" * 40)
    
    # Get Emma's ID and site
    emma_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["emma"]["phone"],
        "pin": TEST_ACCOUNTS["emma"]["pin"]
    })
    
    if not emma_login or emma_login.status_code != 200:
        results.add_result("Clock-in validation setup", False, "Could not login Emma")
        return results
    
    emma_id = emma_login.json()["user"]["id"]
    
    sites_response = make_request("GET", "/sites")
    if not sites_response or sites_response.status_code != 200:
        results.add_result("Clock-in validation setup", False, "Could not get sites")
        return results
    
    sites = sites_response.json()
    if not sites:
        results.add_result("Clock-in validation setup", False, "No sites available")
        return results
    
    site = sites[0]
    site_id = site["id"]
    
    # Test 1: Try to clock-in without rostered shift (should fail with 403)
    clock_in_data = {
        "employee_id": emma_id,
        "site_id": site_id,
        "gps_lat": site["gps_lat"],
        "gps_long": site["gps_long"]
    }
    
    no_roster_response = make_request("POST", "/timesheets/clock-in", clock_in_data)
    
    if no_roster_response and no_roster_response.status_code == 403:
        error_data = no_roster_response.json()
        if "not rostered" in error_data.get("detail", "").lower():
            results.add_result("Block clock-in without roster", True, 
                "Correctly blocked clock-in without rostered shift")
        else:
            results.add_result("Block clock-in without roster", False, 
                f"Wrong error message: {error_data.get('detail')}")
    else:
        status = no_roster_response.status_code if no_roster_response else "No response"
        results.add_result("Block clock-in without roster", False, 
            f"Expected 403, got {status}")
    
    # Test 2: Check for existing rostered shifts for Emma today
    from datetime import datetime
    today = datetime.now()
    start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    todays_shifts_response = make_request("GET", 
        f"/roster/shifts?employee_id={emma_id}&start_date={start_of_day.isoformat()}&end_date={end_of_day.isoformat()}")
    
    if todays_shifts_response and todays_shifts_response.status_code == 200:
        todays_shifts = todays_shifts_response.json()
        results.add_result("Check today's roster shifts", True, 
            f"Emma has {len(todays_shifts)} shifts today")
        
        # Check if any shift is currently active
        current_time = datetime.now()
        active_shift = None
        
        for shift in todays_shifts:
            shift_start = datetime.fromisoformat(shift["start_time"].replace('Z', '+00:00'))
            shift_end = datetime.fromisoformat(shift["end_time"].replace('Z', '+00:00'))
            
            # Allow 30 minute buffer before start
            buffer_start = shift_start - timedelta(minutes=30)
            
            if buffer_start <= current_time <= shift_end:
                active_shift = shift
                break
        
        if active_shift:
            # Test 3: Try to clock-in with active roster (should succeed)
            with_roster_response = make_request("POST", "/timesheets/clock-in", clock_in_data)
            
            if with_roster_response and with_roster_response.status_code == 200:
                result_data = with_roster_response.json()
                if result_data.get("success") and result_data.get("timesheet"):
                    timesheet = result_data["timesheet"]
                    roster_shift_id = timesheet.get("roster_shift_id")
                    results.add_result("Clock-in with roster", True, 
                        f"Successfully clocked in, linked to roster shift: {roster_shift_id}")
                    
                    # Clean up - clock out
                    clock_out_data = {
                        "timesheet_id": timesheet["id"],
                        "gps_lat": site["gps_lat"],
                        "gps_long": site["gps_long"]
                    }
                    
                    clock_out_response = make_request("POST", "/timesheets/clock-out", clock_out_data)
                    if clock_out_response and clock_out_response.status_code == 200:
                        results.add_result("Cleanup clock-out", True, "Successfully clocked out")
                else:
                    results.add_result("Clock-in with roster", False, 
                        "Missing success or timesheet in response")
            else:
                status = with_roster_response.status_code if with_roster_response else "No response"
                results.add_result("Clock-in with roster", False, f"HTTP {status}")
        else:
            results.add_result("Active roster check", True, 
                "No active rostered shift found (expected if no shifts scheduled now)")
    else:
        status = todays_shifts_response.status_code if todays_shifts_response else "No response"
        results.add_result("Check today's roster shifts", False, f"HTTP {status}")
    
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