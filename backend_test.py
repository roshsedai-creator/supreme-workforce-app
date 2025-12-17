#!/usr/bin/env python3
"""
Backend API Testing for Supreme Hospitality Timesheet App
Focus: DELETE endpoints and RBAC permissions testing
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://fieldforce-24.preview.emergentagent.com/api"

# Test credentials from test_result.md
ADMIN_CREDENTIALS = {"identifier": "0457802302", "pin": "1234"}
SUPERVISOR_CREDENTIALS = {"identifier": "0412345678", "pin": "5678"}
EMPLOYEE_CREDENTIALS = {"identifier": "0423456789", "pin": "1111"}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, message, details=None):
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name} - {message}"
        if details:
            result += f"\n    Details: {details}"
        self.results.append(result)
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print(result)
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        print(f"{'='*60}")
        return self.failed == 0

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def login_user(credentials):
    """Login and return user data"""
    response = make_request("POST", "/auth/login", credentials)
    if response and response.status_code == 200:
        return response.json()
    return None

def test_delete_user_endpoint(results):
    """Test DELETE /api/users/{user_id} endpoint"""
    print(f"\n{'='*50}")
    print("TESTING DELETE USER ENDPOINT")
    print(f"{'='*50}")
    
    # Login as admin
    admin_login = login_user(ADMIN_CREDENTIALS)
    if not admin_login:
        results.add_result("DELETE User - Admin Login", False, "Failed to login as admin")
        return
    
    # Create a test user first
    test_user_data = {
        "first_name": "Test",
        "last_name": "DeleteUser",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"test.delete.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Test Employee",
        "pin": "9999"
    }
    
    create_response = make_request("POST", "/users", test_user_data)
    if not create_response or create_response.status_code != 200:
        results.add_result("DELETE User - Create Test User", False, "Failed to create test user for deletion")
        return
    
    created_user = create_response.json()
    user_id = created_user.get("id")
    
    results.add_result("DELETE User - Create Test User", True, f"Created test user with ID: {user_id}")
    
    # Test 1: Delete user with valid ID
    delete_response = make_request("DELETE", f"/users/{user_id}")
    if delete_response and delete_response.status_code == 200:
        delete_data = delete_response.json()
        if delete_data.get("success"):
            results.add_result("DELETE User - Valid ID", True, "Successfully deleted user")
        else:
            results.add_result("DELETE User - Valid ID", False, "Delete response missing success flag")
    else:
        status_code = delete_response.status_code if delete_response else "No response"
        results.add_result("DELETE User - Valid ID", False, f"Delete failed with status: {status_code}")
    
    # Test 2: Verify user is actually deleted
    get_response = make_request("GET", f"/users/{user_id}")
    if get_response and get_response.status_code == 404:
        results.add_result("DELETE User - Verify Deletion", True, "User properly removed from database")
    else:
        results.add_result("DELETE User - Verify Deletion", False, "User still exists after deletion")
    
    # Test 3: Delete with invalid user ID
    invalid_delete = make_request("DELETE", "/users/invalid_id_12345")
    if invalid_delete and invalid_delete.status_code == 404:
        results.add_result("DELETE User - Invalid ID", True, "Properly handles invalid user ID with 404")
    else:
        status_code = invalid_delete.status_code if invalid_delete else "No response"
        results.add_result("DELETE User - Invalid ID", False, f"Invalid ID handling failed: {status_code}")

def test_delete_site_endpoint(results):
    """Test DELETE /api/sites/{site_id} endpoint"""
    print(f"\n{'='*50}")
    print("TESTING DELETE SITE ENDPOINT")
    print(f"{'='*50}")
    
    # Create a test site first
    test_site_data = {
        "name": f"Test Site {uuid.uuid4().hex[:8]}",
        "address": "123 Test Street, Test City",
        "gps_lat": -27.4698,
        "gps_long": 153.0251,
        "radius_meters": 100
    }
    
    create_response = make_request("POST", "/sites", test_site_data)
    if not create_response or create_response.status_code != 200:
        results.add_result("DELETE Site - Create Test Site", False, "Failed to create test site for deletion")
        return
    
    created_site = create_response.json()
    site_id = created_site.get("id")
    
    results.add_result("DELETE Site - Create Test Site", True, f"Created test site with ID: {site_id}")
    
    # Test 1: Delete site with no dependencies (should succeed)
    delete_response = make_request("DELETE", f"/sites/{site_id}")
    if delete_response and delete_response.status_code == 200:
        delete_data = delete_response.json()
        if delete_data.get("success"):
            results.add_result("DELETE Site - No Dependencies", True, "Successfully deleted site with no dependencies")
        else:
            results.add_result("DELETE Site - No Dependencies", False, "Delete response missing success flag")
    else:
        status_code = delete_response.status_code if delete_response else "No response"
        results.add_result("DELETE Site - No Dependencies", False, f"Delete failed with status: {status_code}")
    
    # Test 2: Try to delete site with employees assigned (should fail)
    # First get existing sites to find one with employees
    sites_response = make_request("GET", "/sites")
    users_response = make_request("GET", "/users")
    
    if sites_response and users_response and sites_response.status_code == 200 and users_response.status_code == 200:
        sites = sites_response.json()
        users = users_response.json()
        
        # Find a site that has users assigned
        site_with_users = None
        for site in sites:
            for user in users:
                if user.get("site_id") == site.get("id"):
                    site_with_users = site
                    break
            if site_with_users:
                break
        
        if site_with_users:
            delete_with_users = make_request("DELETE", f"/sites/{site_with_users['id']}")
            if delete_with_users and delete_with_users.status_code == 400:
                error_data = delete_with_users.json()
                if "employee" in error_data.get("detail", "").lower():
                    results.add_result("DELETE Site - With Employees", True, "Properly prevents deletion of site with assigned employees")
                else:
                    results.add_result("DELETE Site - With Employees", False, f"Wrong error message: {error_data.get('detail')}")
            else:
                status_code = delete_with_users.status_code if delete_with_users else "No response"
                results.add_result("DELETE Site - With Employees", False, f"Should have failed with 400, got: {status_code}")
        else:
            results.add_result("DELETE Site - With Employees", False, "No site with assigned employees found for testing")
    
    # Test 3: Delete with invalid site ID
    invalid_delete = make_request("DELETE", "/sites/invalid_site_id_12345")
    if invalid_delete and invalid_delete.status_code == 404:
        results.add_result("DELETE Site - Invalid ID", True, "Properly handles invalid site ID with 404")
    else:
        status_code = invalid_delete.status_code if invalid_delete else "No response"
        results.add_result("DELETE Site - Invalid ID", False, f"Invalid ID handling failed: {status_code}")

def test_delete_timesheet_endpoint(results):
    """Test DELETE /api/timesheets/{timesheet_id} endpoint"""
    print(f"\n{'='*50}")
    print("TESTING DELETE TIMESHEET ENDPOINT")
    print(f"{'='*50}")
    
    # Get existing timesheets to test with
    timesheets_response = make_request("GET", "/timesheets")
    if not timesheets_response or timesheets_response.status_code != 200:
        results.add_result("DELETE Timesheet - Get Timesheets", False, "Failed to fetch existing timesheets")
        return
    
    timesheets = timesheets_response.json()
    if not timesheets:
        results.add_result("DELETE Timesheet - Find Test Data", False, "No timesheets found for testing")
        return
    
    # Find a pending timesheet to delete
    pending_timesheet = None
    for ts in timesheets:
        if ts.get("approval_status") == "pending":
            pending_timesheet = ts
            break
    
    if not pending_timesheet:
        results.add_result("DELETE Timesheet - Find Pending", False, "No pending timesheet found for testing")
        return
    
    timesheet_id = pending_timesheet.get("id")
    results.add_result("DELETE Timesheet - Find Test Data", True, f"Found pending timesheet ID: {timesheet_id}")
    
    # Test 1: Delete pending timesheet
    delete_response = make_request("DELETE", f"/timesheets/{timesheet_id}")
    if delete_response and delete_response.status_code == 200:
        delete_data = delete_response.json()
        if delete_data.get("success"):
            results.add_result("DELETE Timesheet - Valid ID", True, "Successfully deleted pending timesheet")
        else:
            results.add_result("DELETE Timesheet - Valid ID", False, "Delete response missing success flag")
    else:
        status_code = delete_response.status_code if delete_response else "No response"
        results.add_result("DELETE Timesheet - Valid ID", False, f"Delete failed with status: {status_code}")
    
    # Test 2: Delete with invalid timesheet ID
    invalid_delete = make_request("DELETE", "/timesheets/invalid_timesheet_id_12345")
    if invalid_delete and invalid_delete.status_code == 404:
        results.add_result("DELETE Timesheet - Invalid ID", True, "Properly handles invalid timesheet ID with 404")
    else:
        status_code = invalid_delete.status_code if invalid_delete else "No response"
        results.add_result("DELETE Timesheet - Invalid ID", False, f"Invalid ID handling failed: {status_code}")

def test_rbac_permissions(results):
    """Test RBAC - Granular permissions system"""
    print(f"\n{'='*50}")
    print("TESTING RBAC PERMISSIONS SYSTEM")
    print(f"{'='*50}")
    
    # Test 1: Create a new employee and verify default permissions
    new_employee_data = {
        "first_name": "New",
        "last_name": "Employee",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"new.employee.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Room Attendant",
        "pin": "1111"
    }
    
    create_response = make_request("POST", "/users", new_employee_data)
    if not create_response or create_response.status_code != 200:
        results.add_result("RBAC - Create New Employee", False, "Failed to create new employee")
        return
    
    new_employee = create_response.json()
    employee_id = new_employee.get("id")
    results.add_result("RBAC - Create New Employee", True, f"Created new employee with ID: {employee_id}")
    
    # Test 2: Verify new employee has restrictive permissions
    get_response = make_request("GET", f"/users/{employee_id}")
    if get_response and get_response.status_code == 200:
        employee_data = get_response.json()
        permissions = employee_data.get("permissions", {})
        
        # Check that new employee has restrictive permissions
        expected_restrictive = {
            "view_home": True,
            "view_own_timesheets": True,
            "clock_in_out": True,
            "manage_users": False,
            "manage_sites": False,
            "approve_timesheets": False,
            "manage_permissions": False
        }
        
        permissions_correct = True
        permission_details = []
        
        for perm, expected_value in expected_restrictive.items():
            actual_value = permissions.get(perm)
            if actual_value != expected_value:
                permissions_correct = False
                permission_details.append(f"{perm}: expected {expected_value}, got {actual_value}")
            else:
                permission_details.append(f"{perm}: ✓ {actual_value}")
        
        if permissions_correct:
            results.add_result("RBAC - New Employee Permissions", True, "New employee has correct restrictive permissions")
        else:
            results.add_result("RBAC - New Employee Permissions", False, f"Permission issues: {'; '.join(permission_details)}")
    else:
        results.add_result("RBAC - New Employee Permissions", False, "Failed to retrieve new employee data")
    
    # Test 3: Check admin user permissions
    admin_login = login_user(ADMIN_CREDENTIALS)
    if admin_login:
        admin_user = admin_login.get("user", {})
        admin_permissions = admin_user.get("permissions", {})
        
        # Check that admin has full permissions
        admin_should_have = ["manage_users", "manage_sites", "approve_timesheets", "manage_permissions"]
        admin_permissions_correct = True
        admin_details = []
        
        for perm in admin_should_have:
            if not admin_permissions.get(perm, False):
                admin_permissions_correct = False
                admin_details.append(f"{perm}: missing or false")
            else:
                admin_details.append(f"{perm}: ✓ true")
        
        if admin_permissions_correct:
            results.add_result("RBAC - Admin Permissions", True, "Admin has full permissions")
        else:
            results.add_result("RBAC - Admin Permissions", False, f"Admin permission issues: {'; '.join(admin_details)}")
    else:
        results.add_result("RBAC - Admin Permissions", False, "Failed to login as admin")
    
    # Test 4: Test permission updates
    updated_permissions = {
        "permissions": {
            "view_home": True,
            "view_own_timesheets": True,
            "clock_in_out": True,
            "view_roster": True,  # Enable this permission
            "request_time_off": False,
            "view_own_pay": False,
            "view_all_timesheets": False,
            "edit_timesheets": False,
            "approve_timesheets": False,
            "manage_roster": False,
            "view_reports": False,
            "manage_users": False,
            "manage_sites": False,
            "export_payroll": False,
            "manage_permissions": False
        }
    }
    
    update_response = make_request("PUT", f"/users/{employee_id}", updated_permissions)
    if update_response and update_response.status_code == 200:
        # Verify the update persisted
        verify_response = make_request("GET", f"/users/{employee_id}")
        if verify_response and verify_response.status_code == 200:
            updated_user = verify_response.json()
            updated_perms = updated_user.get("permissions", {})
            
            if updated_perms.get("view_roster") == True:
                results.add_result("RBAC - Permission Updates", True, "Permission updates work correctly")
            else:
                results.add_result("RBAC - Permission Updates", False, "Permission update did not persist")
        else:
            results.add_result("RBAC - Permission Updates", False, "Failed to verify permission update")
    else:
        status_code = update_response.status_code if update_response else "No response"
        results.add_result("RBAC - Permission Updates", False, f"Permission update failed: {status_code}")
    
    # Test 5: Test login with new employee (should have updated permissions)
    new_employee_login_data = {
        "identifier": new_employee_data["phone"],
        "pin": new_employee_data["pin"]
    }
    
    employee_login = login_user(new_employee_login_data)
    if employee_login:
        login_user_data = employee_login.get("user", {})
        login_permissions = login_user_data.get("permissions", {})
        
        if login_permissions.get("view_roster") == True and login_permissions.get("manage_users") == False:
            results.add_result("RBAC - Login Permissions", True, "Login returns correct permissions for employee")
        else:
            results.add_result("RBAC - Login Permissions", False, "Login permissions incorrect")
    else:
        results.add_result("RBAC - Login Permissions", False, "Failed to login as new employee")

def main():
    """Run all backend tests"""
    print("🚀 Starting Backend API Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    results = TestResults()
    
    # Test all DELETE endpoints and RBAC
    test_delete_user_endpoint(results)
    test_delete_site_endpoint(results)
    test_delete_timesheet_endpoint(results)
    test_rbac_permissions(results)
    
    # Print final summary
    success = results.summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Backend DELETE endpoints and RBAC are working correctly.")
    else:
        print(f"\n⚠️  {results.failed} TESTS FAILED! See details above.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())