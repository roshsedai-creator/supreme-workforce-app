#!/usr/bin/env python3
"""
Focused testing for specific DELETE endpoint issues
"""

import requests
import json
import uuid

BASE_URL = "https://workforce-doctor.preview.emergentagent.com/api"

def test_delete_user_issue():
    """Test the DELETE user endpoint issue"""
    print("=== TESTING DELETE USER ISSUE ===")
    
    # Create a test user
    test_user = {
        "first_name": "Test",
        "last_name": "User",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"test.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Test Employee",
        "pin": "9999"
    }
    
    # Create user
    create_response = requests.post(f"{BASE_URL}/users", json=test_user, timeout=30)
    print(f"Create user status: {create_response.status_code}")
    if create_response.status_code == 200:
        user_data = create_response.json()
        user_id = user_data.get("id")
        print(f"Created user ID: {user_id}")
        
        # Try to delete
        delete_response = requests.delete(f"{BASE_URL}/users/{user_id}", timeout=30)
        print(f"Delete user status: {delete_response.status_code}")
        print(f"Delete response: {delete_response.text}")
        
        # Check if user still exists
        get_response = requests.get(f"{BASE_URL}/users/{user_id}", timeout=30)
        print(f"Get user after delete status: {get_response.status_code}")
        print(f"Get response: {get_response.text}")
    else:
        print(f"Failed to create user: {create_response.text}")

def test_delete_timesheet():
    """Test DELETE timesheet endpoint"""
    print("\n=== TESTING DELETE TIMESHEET ===")
    
    # Get timesheets
    response = requests.get(f"{BASE_URL}/timesheets", timeout=30)
    if response.status_code == 200:
        timesheets = response.json()
        print(f"Found {len(timesheets)} timesheets")
        
        # Find a timesheet to delete (preferably pending)
        test_timesheet = None
        for ts in timesheets:
            if ts.get("approval_status") == "pending":
                test_timesheet = ts
                break
        
        if not test_timesheet and timesheets:
            test_timesheet = timesheets[0]  # Use any timesheet
        
        if test_timesheet:
            timesheet_id = test_timesheet.get("id")
            print(f"Testing with timesheet ID: {timesheet_id}")
            print(f"Timesheet status: {test_timesheet.get('approval_status')}")
            
            # Try to delete
            delete_response = requests.delete(f"{BASE_URL}/timesheets/{timesheet_id}", timeout=30)
            print(f"Delete timesheet status: {delete_response.status_code}")
            print(f"Delete response: {delete_response.text}")
        else:
            print("No timesheets found to test deletion")
    else:
        print(f"Failed to get timesheets: {response.status_code}")

def test_rbac_new_user():
    """Test RBAC for new user creation"""
    print("\n=== TESTING RBAC NEW USER ===")
    
    # Create a new employee
    new_employee = {
        "first_name": "RBAC",
        "last_name": "Test",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"rbac.test.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Room Attendant",
        "pin": "1111"
    }
    
    create_response = requests.post(f"{BASE_URL}/users", json=new_employee, timeout=30)
    print(f"Create employee status: {create_response.status_code}")
    
    if create_response.status_code == 200:
        user_data = create_response.json()
        user_id = user_data.get("id")
        print(f"Created employee ID: {user_id}")
        
        # Get the user to check permissions
        get_response = requests.get(f"{BASE_URL}/users/{user_id}", timeout=30)
        print(f"Get user status: {get_response.status_code}")
        
        if get_response.status_code == 200:
            user_details = get_response.json()
            permissions = user_details.get("permissions")
            print(f"User permissions: {json.dumps(permissions, indent=2)}")
            
            # Check if permissions exist and are correct
            if permissions is None:
                print("❌ ISSUE: No permissions object found!")
            else:
                expected_perms = {
                    "view_home": True,
                    "view_own_timesheets": True,
                    "clock_in_out": True,
                    "manage_users": False,
                    "manage_sites": False
                }
                
                issues = []
                for perm, expected in expected_perms.items():
                    actual = permissions.get(perm)
                    if actual != expected:
                        issues.append(f"{perm}: expected {expected}, got {actual}")
                
                if issues:
                    print(f"❌ Permission issues: {'; '.join(issues)}")
                else:
                    print("✅ Permissions are correct")
        else:
            print(f"Failed to get user details: {get_response.text}")
    else:
        print(f"Failed to create employee: {create_response.text}")

def test_invalid_id_handling():
    """Test handling of invalid IDs"""
    print("\n=== TESTING INVALID ID HANDLING ===")
    
    # Test invalid user ID
    try:
        delete_response = requests.delete(f"{BASE_URL}/users/invalid_id_12345", timeout=30)
        print(f"Delete invalid user ID status: {delete_response.status_code}")
        print(f"Response: {delete_response.text}")
    except Exception as e:
        print(f"Error with invalid user ID: {e}")
    
    # Test invalid site ID
    try:
        delete_response = requests.delete(f"{BASE_URL}/sites/invalid_site_id_12345", timeout=30)
        print(f"Delete invalid site ID status: {delete_response.status_code}")
        print(f"Response: {delete_response.text}")
    except Exception as e:
        print(f"Error with invalid site ID: {e}")

if __name__ == "__main__":
    test_delete_user_issue()
    test_delete_timesheet()
    test_rbac_new_user()
    test_invalid_id_handling()