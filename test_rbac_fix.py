#!/usr/bin/env python3
"""
Test script to verify RBAC is working correctly for new employees
"""
import requests
import uuid

BASE_URL = "https://workforce-timesheet.preview.emergentagent.com/api"

def test_new_employee_permissions():
    """Test that new employees have restrictive permissions"""
    print("🔍 Testing RBAC for New Employee Registration")
    print("=" * 60)
    
    # Create a new employee via registration
    random_id = uuid.uuid4().hex[:8]
    test_employee = {
        "first_name": "RBAC",
        "last_name": "TestEmployee",
        "phone": f"04{random_id[:8]}",
        "email": f"rbac.test.{random_id}@test.com",
        "pin": "9999",
        "job_title": "Test Employee"
    }
    
    print(f"\n1️⃣  Creating new employee via registration...")
    print(f"   Phone: {test_employee['phone']}")
    
    try:
        # Register new employee
        response = requests.post(f"{BASE_URL}/auth/register", json=test_employee, timeout=10)
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"   ✅ Employee registered successfully")
            
            # Check if user_data has user object
            user = user_data.get("user", user_data)
            
            print(f"\n2️⃣  Checking permissions...")
            permissions = user.get("permissions", {})
            
            print(f"\n   📋 Permissions received:")
            for key, value in permissions.items():
                symbol = "✅" if value else "❌"
                print(f"      {symbol} {key}: {value}")
            
            # Verify restrictive permissions
            print(f"\n3️⃣  Verifying restrictive permissions for employee...")
            
            checks = {
                "view_home": (permissions.get("view_home") == True, "Should have view_home"),
                "view_own_timesheets": (permissions.get("view_own_timesheets") == True, "Should have view_own_timesheets"),
                "clock_in_out": (permissions.get("clock_in_out") == True, "Should have clock_in_out"),
                "view_all_timesheets": (permissions.get("view_all_timesheets") == False, "Should NOT have view_all_timesheets"),
                "approve_timesheets": (permissions.get("approve_timesheets") == False, "Should NOT have approve_timesheets"),
                "manage_users": (permissions.get("manage_users") == False, "Should NOT have manage_users"),
                "manage_sites": (permissions.get("manage_sites") == False, "Should NOT have manage_sites"),
                "export_payroll": (permissions.get("export_payroll") == False, "Should NOT have export_payroll"),
            }
            
            passed = 0
            failed = 0
            
            for check_name, (passed_check, description) in checks.items():
                if passed_check:
                    print(f"   ✅ {description}")
                    passed += 1
                else:
                    print(f"   ❌ {description}")
                    failed += 1
            
            print(f"\n" + "=" * 60)
            print(f"📊 Test Results: {passed} passed, {failed} failed")
            
            if failed == 0:
                print("✅ RBAC IS WORKING CORRECTLY! New employees have restrictive permissions.")
            else:
                print("❌ RBAC FAILURE! New employees have incorrect permissions.")
                print("\n⚠️  PROBLEM: New employees are getting admin/supervisor access!")
                
            # Now test login to see if permissions persist
            print(f"\n4️⃣  Testing login with new employee...")
            login_response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"identifier": test_employee["phone"], "pin": test_employee["pin"]},
                timeout=10
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                logged_in_user = login_data.get("user", {})
                logged_in_permissions = logged_in_user.get("permissions", {})
                
                print(f"   ✅ Login successful")
                print(f"\n   📋 Permissions after login:")
                for key, value in logged_in_permissions.items():
                    symbol = "✅" if value else "❌"
                    print(f"      {symbol} {key}: {value}")
                
                # Check if permissions match
                if logged_in_permissions == permissions:
                    print(f"\n   ✅ Permissions are consistent after login")
                else:
                    print(f"\n   ⚠️  WARNING: Permissions changed after login!")
                    print(f"      Expected: {permissions}")
                    print(f"      Got: {logged_in_permissions}")
            
        else:
            print(f"   ❌ Registration failed: {response.status_code}")
            print(f"      Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_new_employee_permissions()
