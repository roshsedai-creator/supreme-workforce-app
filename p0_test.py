#!/usr/bin/env python3
"""
P0 Features Testing - Admin User Management & Bank Details
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://fieldforce-24.preview.emergentagent.com/api"

# Test accounts
TEST_ACCOUNTS = {
    "admin": {
        "phone": "0457802302",
        "pin": "1234"
    }
}

def make_request(method, endpoint, data=None, timeout=10):
    """Make HTTP request with error handling"""
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
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.Timeout:
        print(f"⏰ Request timeout for {method} {endpoint}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed for {method} {endpoint}: {e}")
        return None

def test_p0_features():
    """Test P0 Admin User Management and Bank Details features"""
    print("🚀 TESTING P0 FEATURES: Admin User Management & Bank Details")
    print("=" * 70)
    
    # Login as admin
    print("\n🔐 Admin Login...")
    admin_login = make_request("POST", "/auth/login", {
        "identifier": TEST_ACCOUNTS["admin"]["phone"],
        "pin": TEST_ACCOUNTS["admin"]["pin"]
    })
    
    if not admin_login or admin_login.status_code != 200:
        print("❌ Cannot proceed without admin access")
        return False
    
    admin_user = admin_login.json()["user"]
    print(f"✅ Admin login successful: {admin_user.get('first_name')} {admin_user.get('last_name')}")
    
    # Get existing employees for testing
    print("\n👥 Getting test employees...")
    employees_response = make_request("GET", "/users?role=employee")
    
    if not employees_response or employees_response.status_code != 200:
        print("❌ Could not get employees")
        return False
    
    employees = employees_response.json()
    if not employees:
        print("❌ No employees found")
        return False
    
    test_employee = employees[0]
    print(f"✅ Using test employee: {test_employee.get('first_name')} {test_employee.get('last_name')}")
    
    # Test results tracking
    results = {"passed": 0, "failed": 0, "tests": []}
    
    def log_test(name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
        if details:
            print(f"   {details}")
        
        results["tests"].append({"name": name, "success": success, "details": details})
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    print("\n" + "="*70)
    print("TESTING ADMIN USER MANAGEMENT")
    print("="*70)
    
    # Test 1: Create user for deletion test
    print("\n🔧 Creating test user for deletion...")
    test_user_data = {
        "first_name": "Test",
        "last_name": "DeleteUser",
        "phone": "0400000099",
        "email": "test.delete99@example.com",
        "role": "employee",
        "job_title": "Room Attendant",
        "pin": "9999"
    }
    
    create_response = make_request("POST", "/users", test_user_data)
    
    if create_response and create_response.status_code == 200:
        test_user = create_response.json()
        user_id = test_user.get('id')
        print(f"✅ Test user created: {user_id}")
        
        # Test 2: Delete the user
        print("\n🗑️ Testing user deletion...")
        delete_response = make_request("DELETE", f"/users/{user_id}")
        
        if delete_response and delete_response.status_code == 200:
            delete_data = delete_response.json()
            if delete_data.get('success'):
                log_test("User Deletion - Valid ID", True, f"User {user_id} deleted successfully")
                
                # Verify deletion
                verify_response = make_request("GET", f"/users/{user_id}")
                if verify_response and verify_response.status_code == 404:
                    log_test("User Deletion - Verification", True, "User properly removed from database")
                else:
                    log_test("User Deletion - Verification", False, f"User still exists (HTTP {verify_response.status_code if verify_response else 'No response'})")
            else:
                log_test("User Deletion - Valid ID", False, "Success flag not set in response")
        else:
            log_test("User Deletion - Valid ID", False, f"HTTP {delete_response.status_code if delete_response else 'No response'}")
    else:
        log_test("Create Test User", False, f"HTTP {create_response.status_code if create_response else 'No response'}")
    
    # Test 3: Delete non-existent user
    print("\n🚫 Testing deletion of non-existent user...")
    fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
    invalid_delete = make_request("DELETE", f"/users/{fake_id}")
    
    if invalid_delete and invalid_delete.status_code == 404:
        log_test("User Deletion - Invalid ID", True, "Correctly returned 404 for non-existent user")
    else:
        log_test("User Deletion - Invalid ID", False, f"Expected 404, got {invalid_delete.status_code if invalid_delete else 'No response'}")
    
    # Test 4: User status management
    print("\n👤 Testing user status management...")
    employee_id = test_employee.get('id')
    
    # Set to inactive
    inactive_response = make_request("PUT", f"/users/{employee_id}", {"status": "inactive"})
    
    if inactive_response and inactive_response.status_code == 200:
        data = inactive_response.json()
        if data.get('success') and data.get('user', {}).get('status') == 'inactive':
            log_test("User Status - Set Inactive", True, "Status updated to inactive")
            
            # Test login with inactive user
            login_test = make_request("POST", "/auth/login", {
                "identifier": test_employee.get('phone'),
                "pin": test_employee.get('pin', '1111')
            })
            
            if login_test and login_test.status_code == 404:
                log_test("Inactive User Login Block", True, "Inactive user correctly blocked from login")
            else:
                log_test("Inactive User Login Block", False, f"Expected 404, got {login_test.status_code if login_test else 'No response'}")
            
            # Reactivate user
            active_response = make_request("PUT", f"/users/{employee_id}", {"status": "active"})
            
            if active_response and active_response.status_code == 200:
                reactivate_data = active_response.json()
                if reactivate_data.get('success') and reactivate_data.get('user', {}).get('status') == 'active':
                    log_test("User Status - Reactivate", True, "User successfully reactivated")
                else:
                    log_test("User Status - Reactivate", False, "Failed to reactivate user")
            else:
                log_test("User Status - Reactivate", False, f"HTTP {active_response.status_code if active_response else 'No response'}")
        else:
            log_test("User Status - Set Inactive", False, "Status not updated correctly")
    else:
        log_test("User Status - Set Inactive", False, f"HTTP {inactive_response.status_code if inactive_response else 'No response'}")
    
    print("\n" + "="*70)
    print("TESTING BANK DETAILS MANAGEMENT")
    print("="*70)
    
    # Test 5: Save bank details
    print("\n🏦 Testing bank details save...")
    bank_details_data = {
        "bank_details": {
            "bank_name": "ANZ",
            "account_name": "John Admin",
            "bsb": "123456",
            "account_number": "98765432"
        }
    }
    
    save_response = make_request("PUT", f"/users/{employee_id}", bank_details_data)
    
    if save_response and save_response.status_code == 200:
        data = save_response.json()
        if data.get('success'):
            saved_details = data.get('user', {}).get('bank_details', {})
            
            # Verify all fields
            expected_fields = ["bank_name", "account_name", "bsb", "account_number"]
            all_correct = all(
                saved_details.get(field) == bank_details_data["bank_details"][field]
                for field in expected_fields
            )
            
            if all_correct:
                log_test("Bank Details - Save All Fields", True, "All bank details saved correctly")
            else:
                log_test("Bank Details - Save All Fields", False, f"Field mismatch: {saved_details}")
        else:
            log_test("Bank Details - Save All Fields", False, "Success flag not set")
    else:
        log_test("Bank Details - Save All Fields", False, f"HTTP {save_response.status_code if save_response else 'No response'}")
    
    # Test 6: Update bank details
    print("\n💳 Testing bank details update...")
    updated_details = {
        "bank_details": {
            "bank_name": "Commonwealth Bank",
            "account_name": "John Updated",
            "bsb": "654321",
            "account_number": "12345678"
        }
    }
    
    update_response = make_request("PUT", f"/users/{employee_id}", updated_details)
    
    if update_response and update_response.status_code == 200:
        data = update_response.json()
        if data.get('success'):
            updated_saved = data.get('user', {}).get('bank_details', {})
            
            if updated_saved.get('bank_name') == 'Commonwealth Bank':
                log_test("Bank Details - Update", True, "Bank details updated successfully")
            else:
                log_test("Bank Details - Update", False, f"Update failed: {updated_saved}")
        else:
            log_test("Bank Details - Update", False, "Success flag not set")
    else:
        log_test("Bank Details - Update", False, f"HTTP {update_response.status_code if update_response else 'No response'}")
    
    # Test 7: Retrieve bank details (single user)
    print("\n📋 Testing bank details retrieval...")
    get_user_response = make_request("GET", f"/users/{employee_id}")
    
    if get_user_response and get_user_response.status_code == 200:
        user_data = get_user_response.json()
        bank_details = user_data.get('bank_details', {})
        
        if bank_details and bank_details.get('bank_name') == 'Commonwealth Bank':
            log_test("Bank Details - Retrieve Single User", True, "Bank details retrieved correctly")
        else:
            log_test("Bank Details - Retrieve Single User", False, f"Bank details missing or incorrect: {bank_details}")
    else:
        log_test("Bank Details - Retrieve Single User", False, f"HTTP {get_user_response.status_code if get_user_response else 'No response'}")
    
    # Test 8: Retrieve bank details (all users)
    print("\n📊 Testing bank details in users list...")
    all_users_response = make_request("GET", "/users")
    
    if all_users_response and all_users_response.status_code == 200:
        all_users = all_users_response.json()
        
        # Find our test user
        test_user_found = False
        for user in all_users:
            if user.get('id') == employee_id:
                test_user_found = True
                user_bank_details = user.get('bank_details', {})
                
                if user_bank_details and user_bank_details.get('bank_name') == 'Commonwealth Bank':
                    log_test("Bank Details - Retrieve All Users", True, "Bank details included in users list")
                else:
                    log_test("Bank Details - Retrieve All Users", False, f"Bank details missing in list: {user_bank_details}")
                break
        
        if not test_user_found:
            log_test("Bank Details - Retrieve All Users", False, "Test user not found in users list")
    else:
        log_test("Bank Details - Retrieve All Users", False, f"HTTP {all_users_response.status_code if all_users_response else 'No response'}")
    
    # Print final summary
    print("\n" + "="*70)
    print("P0 FEATURES TEST SUMMARY")
    print("="*70)
    
    total_tests = results["passed"] + results["failed"]
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed']/total_tests*100):.1f}%")
    
    if results["failed"] > 0:
        print(f"\nFAILED TESTS:")
        for test in results["tests"]:
            if not test["success"]:
                print(f"❌ {test['name']}: {test['details']}")
    
    print(f"\nTest completed at: {datetime.now().isoformat()}")
    
    return results["failed"] == 0

if __name__ == "__main__":
    success = test_p0_features()
    exit(0 if success else 1)