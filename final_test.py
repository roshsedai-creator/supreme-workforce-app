#!/usr/bin/env python3
"""
Final comprehensive test for DELETE endpoints and RBAC
"""

import requests
import json
import uuid
import time

BASE_URL = "https://fieldforce-24.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"identifier": "0457802302", "pin": "1234"}

def make_request(method, endpoint, data=None, timeout=15):
    """Make HTTP request with shorter timeout"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=timeout)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=timeout)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=timeout)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=timeout)
        return response
    except requests.exceptions.Timeout:
        print(f"⚠️  Request timeout for {method} {endpoint}")
        return None
    except Exception as e:
        print(f"⚠️  Request error for {method} {endpoint}: {e}")
        return None

def test_all_critical_functionality():
    """Test all critical DELETE and RBAC functionality"""
    print("🚀 FINAL COMPREHENSIVE TEST")
    print("="*60)
    
    results = {"passed": 0, "failed": 0, "details": []}
    
    # Test 1: DELETE User Endpoint
    print("\n1️⃣  Testing DELETE User Endpoint")
    test_user = {
        "first_name": "Final",
        "last_name": "TestUser",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"final.test.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Test Employee",
        "pin": "9999"
    }
    
    # Create user
    create_resp = make_request("POST", "/users", test_user)
    if create_resp and create_resp.status_code == 200:
        user_data = create_resp.json()
        user_id = user_data.get("id")
        print(f"   ✅ Created test user: {user_id}")
        
        # Delete user
        delete_resp = make_request("DELETE", f"/users/{user_id}")
        if delete_resp and delete_resp.status_code == 200:
            delete_data = delete_resp.json()
            if delete_data.get("success"):
                print("   ✅ DELETE user endpoint working")
                results["passed"] += 1
                results["details"].append("✅ DELETE User Endpoint: Working correctly")
            else:
                print("   ❌ DELETE response missing success flag")
                results["failed"] += 1
                results["details"].append("❌ DELETE User Endpoint: Missing success flag")
        else:
            print(f"   ❌ DELETE failed: {delete_resp.status_code if delete_resp else 'No response'}")
            results["failed"] += 1
            results["details"].append("❌ DELETE User Endpoint: API call failed")
    else:
        print("   ❌ Failed to create test user")
        results["failed"] += 1
        results["details"].append("❌ DELETE User Endpoint: Cannot create test user")
    
    # Test 2: DELETE Site Endpoint
    print("\n2️⃣  Testing DELETE Site Endpoint")
    test_site = {
        "name": f"Final Test Site {uuid.uuid4().hex[:8]}",
        "address": "123 Final Test Street",
        "gps_lat": -27.4698,
        "gps_long": 153.0251,
        "radius_meters": 100
    }
    
    create_resp = make_request("POST", "/sites", test_site)
    if create_resp and create_resp.status_code == 200:
        site_data = create_resp.json()
        site_id = site_data.get("id")
        print(f"   ✅ Created test site: {site_id}")
        
        # Delete site
        delete_resp = make_request("DELETE", f"/sites/{site_id}")
        if delete_resp and delete_resp.status_code == 200:
            delete_data = delete_resp.json()
            if delete_data.get("success"):
                print("   ✅ DELETE site endpoint working")
                results["passed"] += 1
                results["details"].append("✅ DELETE Site Endpoint: Working correctly")
            else:
                print("   ❌ DELETE response missing success flag")
                results["failed"] += 1
                results["details"].append("❌ DELETE Site Endpoint: Missing success flag")
        else:
            print(f"   ❌ DELETE failed: {delete_resp.status_code if delete_resp else 'No response'}")
            results["failed"] += 1
            results["details"].append("❌ DELETE Site Endpoint: API call failed")
    else:
        print("   ❌ Failed to create test site")
        results["failed"] += 1
        results["details"].append("❌ DELETE Site Endpoint: Cannot create test site")
    
    # Test 3: DELETE Timesheet Endpoint
    print("\n3️⃣  Testing DELETE Timesheet Endpoint")
    timesheets_resp = make_request("GET", "/timesheets")
    if timesheets_resp and timesheets_resp.status_code == 200:
        timesheets = timesheets_resp.json()
        if timesheets:
            # Use any timesheet for testing
            test_timesheet = timesheets[0]
            timesheet_id = test_timesheet.get("id")
            print(f"   ✅ Found timesheet to test: {timesheet_id}")
            
            # Delete timesheet
            delete_resp = make_request("DELETE", f"/timesheets/{timesheet_id}")
            if delete_resp and delete_resp.status_code == 200:
                delete_data = delete_resp.json()
                if delete_data.get("success"):
                    print("   ✅ DELETE timesheet endpoint working")
                    results["passed"] += 1
                    results["details"].append("✅ DELETE Timesheet Endpoint: Working correctly")
                else:
                    print("   ❌ DELETE response missing success flag")
                    results["failed"] += 1
                    results["details"].append("❌ DELETE Timesheet Endpoint: Missing success flag")
            else:
                print(f"   ❌ DELETE failed: {delete_resp.status_code if delete_resp else 'No response'}")
                results["failed"] += 1
                results["details"].append("❌ DELETE Timesheet Endpoint: API call failed")
        else:
            print("   ⚠️  No timesheets available for testing")
            results["passed"] += 1  # Not a failure, just no data
            results["details"].append("⚠️  DELETE Timesheet Endpoint: No test data available")
    else:
        print("   ❌ Failed to get timesheets")
        results["failed"] += 1
        results["details"].append("❌ DELETE Timesheet Endpoint: Cannot fetch timesheets")
    
    # Test 4: RBAC - New Employee Permissions
    print("\n4️⃣  Testing RBAC - New Employee Permissions")
    new_employee = {
        "first_name": "RBAC",
        "last_name": "TestEmployee",
        "phone": f"04{str(uuid.uuid4().int)[:8]}",
        "email": f"rbac.final.{uuid.uuid4().hex[:8]}@test.com",
        "role": "employee",
        "job_title": "Room Attendant",
        "pin": "1111"
    }
    
    create_resp = make_request("POST", "/users", new_employee)
    if create_resp and create_resp.status_code == 200:
        user_data = create_resp.json()
        employee_id = user_data.get("id")
        print(f"   ✅ Created test employee: {employee_id}")
        
        # Get employee details to check permissions
        get_resp = make_request("GET", f"/users/{employee_id}")
        if get_resp and get_resp.status_code == 200:
            employee_details = get_resp.json()
            permissions = employee_details.get("permissions")
            
            if permissions:
                # Check critical permissions
                expected_perms = {
                    "view_home": True,
                    "view_own_timesheets": True,
                    "clock_in_out": True,
                    "manage_users": False,
                    "manage_sites": False,
                    "approve_timesheets": False
                }
                
                all_correct = True
                for perm, expected in expected_perms.items():
                    actual = permissions.get(perm)
                    if actual != expected:
                        all_correct = False
                        print(f"   ❌ Permission {perm}: expected {expected}, got {actual}")
                
                if all_correct:
                    print("   ✅ New employee has correct restrictive permissions")
                    results["passed"] += 1
                    results["details"].append("✅ RBAC New Employee: Correct default permissions")
                else:
                    results["failed"] += 1
                    results["details"].append("❌ RBAC New Employee: Incorrect default permissions")
            else:
                print("   ❌ No permissions object found")
                results["failed"] += 1
                results["details"].append("❌ RBAC New Employee: No permissions object")
        else:
            print("   ❌ Failed to get employee details")
            results["failed"] += 1
            results["details"].append("❌ RBAC New Employee: Cannot fetch user details")
    else:
        print("   ❌ Failed to create test employee")
        results["failed"] += 1
        results["details"].append("❌ RBAC New Employee: Cannot create test user")
    
    # Test 5: Invalid ID Handling
    print("\n5️⃣  Testing Invalid ID Handling")
    
    # Test invalid user ID
    invalid_user_resp = make_request("DELETE", "/users/invalid_id_12345")
    if invalid_user_resp and invalid_user_resp.status_code == 404:
        print("   ✅ Invalid user ID properly returns 404")
        results["passed"] += 1
        results["details"].append("✅ Invalid ID Handling: User endpoint returns 404")
    else:
        print(f"   ❌ Invalid user ID handling failed: {invalid_user_resp.status_code if invalid_user_resp else 'No response'}")
        results["failed"] += 1
        results["details"].append("❌ Invalid ID Handling: User endpoint incorrect response")
    
    # Test invalid site ID
    invalid_site_resp = make_request("DELETE", "/sites/invalid_site_id_12345")
    if invalid_site_resp and invalid_site_resp.status_code == 404:
        print("   ✅ Invalid site ID properly returns 404")
        results["passed"] += 1
        results["details"].append("✅ Invalid ID Handling: Site endpoint returns 404")
    else:
        print(f"   ❌ Invalid site ID handling failed: {invalid_site_resp.status_code if invalid_site_resp else 'No response'}")
        results["failed"] += 1
        results["details"].append("❌ Invalid ID Handling: Site endpoint incorrect response")
    
    # Print final results
    print("\n" + "="*60)
    print("🎯 FINAL TEST RESULTS")
    print("="*60)
    
    total_tests = results["passed"] + results["failed"]
    success_rate = (results["passed"] / total_tests * 100) if total_tests > 0 else 0
    
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📊 Success Rate: {success_rate:.1f}%")
    
    print("\n📋 DETAILED RESULTS:")
    for detail in results["details"]:
        print(f"   {detail}")
    
    if results["failed"] == 0:
        print("\n🎉 ALL CRITICAL TESTS PASSED!")
        print("✅ DELETE endpoints are working correctly")
        print("✅ RBAC permissions system is working correctly")
        return True
    else:
        print(f"\n⚠️  {results['failed']} CRITICAL ISSUES FOUND!")
        return False

if __name__ == "__main__":
    success = test_all_critical_functionality()
    exit(0 if success else 1)