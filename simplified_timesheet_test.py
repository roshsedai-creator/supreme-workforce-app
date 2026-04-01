#!/usr/bin/env python3
"""
Backend API Testing for Simplified Timesheet App
Tests the core timesheet management APIs as requested in the review
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://supreme-sop-gen.preview.emergentagent.com/api"

# Test credentials from review request
EMPLOYEE_CREDS = {"identifier": "0420576508", "pin": "2003"}  # Nagita
SUPERVISOR_CREDS = {"identifier": "0457802302", "pin": "1234"}  # John Admin

class SimplifiedTimesheetTester:
    def __init__(self):
        self.employee_user = None
        self.supervisor_user = None
        self.test_timesheet_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def test_1_login_api(self):
        """Test 1: Login API - POST /api/auth/login"""
        print("\n=== Test 1: Login API ===")
        
        # Test employee login (Nagita)
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json=EMPLOYEE_CREDS, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user"):
                    self.employee_user = data["user"]
                    name = f"{self.employee_user.get('first_name')} {self.employee_user.get('last_name')}"
                    self.log_result("Employee Login (Nagita)", True, f"Successfully logged in as {name}")
                else:
                    self.log_result("Employee Login (Nagita)", False, "Login response missing user data", data)
            else:
                self.log_result("Employee Login (Nagita)", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Employee Login (Nagita)", False, f"Request failed: {str(e)}")
        
        # Test supervisor login (John Admin)
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json=SUPERVISOR_CREDS, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user"):
                    self.supervisor_user = data["user"]
                    name = f"{self.supervisor_user.get('first_name')} {self.supervisor_user.get('last_name')}"
                    self.log_result("Supervisor Login (John Admin)", True, f"Successfully logged in as {name}")
                else:
                    self.log_result("Supervisor Login (John Admin)", False, "Login response missing user data", data)
            else:
                self.log_result("Supervisor Login (John Admin)", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Supervisor Login (John Admin)", False, f"Request failed: {str(e)}")
    
    def test_2_manual_timesheet_creation(self):
        """Test 2: Manual Timesheet Creation - POST /api/timesheets/manual"""
        print("\n=== Test 2: Manual Timesheet Creation ===")
        
        if not self.employee_user:
            self.log_result("Manual Timesheet Creation", False, "No employee user available (login failed)")
            return
        
        # Create manual timesheet with the new format as specified in review
        timesheet_data = {
            "employee_id": self.employee_user["id"],
            "date": "2024-12-23",
            "clock_in_time": "09:00",
            "clock_out_time": "17:00",
            "break_minutes": 30,
            "notes": "Test entry"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/timesheets/manual", json=timesheet_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("timesheet"):
                    timesheet = data["timesheet"]
                    self.test_timesheet_id = timesheet.get("id")
                    total_hours = timesheet.get("total_hours", 0)
                    status = timesheet.get("approval_status", "unknown")
                    self.log_result("Manual Timesheet Creation", True, 
                                  f"Created timesheet ID: {self.test_timesheet_id}, Hours: {total_hours}, Status: {status}")
                else:
                    self.log_result("Manual Timesheet Creation", False, "Response missing timesheet data", data)
            else:
                self.log_result("Manual Timesheet Creation", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Manual Timesheet Creation", False, f"Request failed: {str(e)}")
    
    def test_3_get_timesheets(self):
        """Test 3: Get Timesheets - GET /api/timesheets?employee_id={user_id}"""
        print("\n=== Test 3: Get Timesheets ===")
        
        if not self.employee_user:
            self.log_result("Get Timesheets", False, "No employee user available (login failed)")
            return
        
        try:
            response = requests.get(f"{BACKEND_URL}/timesheets?employee_id={self.employee_user['id']}", timeout=10)
            if response.status_code == 200:
                timesheets = response.json()
                if isinstance(timesheets, list):
                    count = len(timesheets)
                    self.log_result("Get Timesheets", True, f"Retrieved {count} timesheets for employee")
                    
                    # Show details of first few timesheets
                    for i, ts in enumerate(timesheets[:3]):
                        date = ts.get("clock_in", "No date")
                        status = ts.get("approval_status", "unknown")
                        hours = ts.get("total_hours", 0)
                        print(f"   Timesheet {i+1}: Date: {date}, Hours: {hours}, Status: {status}")
                else:
                    self.log_result("Get Timesheets", False, "Response is not a list", timesheets)
            else:
                self.log_result("Get Timesheets", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Timesheets", False, f"Request failed: {str(e)}")
    
    def test_4_update_timesheet(self):
        """Test 4: Update Timesheet - PUT /api/timesheets/{timesheet_id}"""
        print("\n=== Test 4: Update Timesheet ===")
        
        if not self.test_timesheet_id:
            self.log_result("Update Timesheet", False, "No test timesheet ID available (creation failed)")
            return
        
        # Update timesheet data as specified in review
        update_data = {
            "date": "2024-12-23",
            "clock_in_time": "08:30",
            "clock_out_time": "17:30",
            "break_minutes": 45,
            "notes": "Updated entry"
        }
        
        try:
            response = requests.put(f"{BACKEND_URL}/timesheets/{self.test_timesheet_id}", json=update_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    timesheet = data.get("timesheet", {})
                    total_hours = timesheet.get("total_hours", 0)
                    break_mins = timesheet.get("break_minutes", 0)
                    self.log_result("Update Timesheet", True, 
                                  f"Updated timesheet - Hours: {total_hours}, Break: {break_mins} mins")
                else:
                    self.log_result("Update Timesheet", False, "Response indicates failure", data)
            else:
                self.log_result("Update Timesheet", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Update Timesheet", False, f"Request failed: {str(e)}")
    
    def test_5_approve_timesheet(self):
        """Test 5: Approve Timesheet - PUT /api/timesheets/{timesheet_id}/approve"""
        print("\n=== Test 5: Approve Timesheet (as supervisor) ===")
        
        if not self.supervisor_user:
            self.log_result("Approve Timesheet", False, "No supervisor user available (login failed)")
            return
            
        if not self.test_timesheet_id:
            self.log_result("Approve Timesheet", False, "No test timesheet ID available (creation failed)")
            return
        
        # Approve timesheet as specified in review
        approval_data = {
            "status": "approved",
            "approved_by": self.supervisor_user["id"]
        }
        
        try:
            response = requests.put(f"{BACKEND_URL}/timesheets/{self.test_timesheet_id}/approve", json=approval_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    timesheet = data.get("timesheet", {})
                    status = timesheet.get("approval_status", "unknown")
                    approved_by = timesheet.get("approved_by", "unknown")
                    self.log_result("Approve Timesheet", True, 
                                  f"Timesheet approved - Status: {status}, Approved by: {approved_by}")
                else:
                    self.log_result("Approve Timesheet", False, "Response indicates failure", data)
            else:
                self.log_result("Approve Timesheet", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Approve Timesheet", False, f"Request failed: {str(e)}")
    
    def test_6_get_all_users(self):
        """Test 6: Get All Users - GET /api/users (for supervisor employee picker)"""
        print("\n=== Test 6: Get All Users ===")
        
        try:
            response = requests.get(f"{BACKEND_URL}/users", timeout=10)
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    count = len(users)
                    self.log_result("Get All Users", True, f"Retrieved {count} users for employee picker")
                    
                    # Show details of first few users
                    for i, user in enumerate(users[:5]):
                        name = f"{user.get('first_name', '')} {user.get('last_name', '')}"
                        role = user.get('role', 'unknown')
                        phone = user.get('phone', 'no phone')
                        print(f"   User {i+1}: {name} ({role}) - {phone}")
                else:
                    self.log_result("Get All Users", False, "Response is not a list", users)
            else:
                self.log_result("Get All Users", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get All Users", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Simplified Timesheet App Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing APIs: Login, Manual Timesheet Creation, Get Timesheets, Update, Approve, Get Users")
        print("=" * 80)
        
        # Run tests in order as specified in review
        self.test_1_login_api()
        self.test_2_manual_timesheet_creation()
        self.test_3_get_timesheets()
        self.test_4_update_timesheet()
        self.test_5_approve_timesheet()
        self.test_6_get_all_users()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 SIMPLIFIED TIMESHEET API TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            print(f"\n🔍 FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   ❌ {test['test']}: {test['message']}")
                if test['details']:
                    print(f"      Details: {test['details']}")
        
        if passed == total:
            print("\n🎉 ALL SIMPLIFIED TIMESHEET APIS WORKING CORRECTLY!")
            print("✅ Login API working")
            print("✅ Manual timesheet creation working") 
            print("✅ Get timesheets working")
            print("✅ Update timesheet working")
            print("✅ Approve timesheet working")
            print("✅ Get all users working")
        else:
            print(f"\n⚠️  {total - passed} API(s) failed. Check the details above.")
            
        return passed == total

if __name__ == "__main__":
    tester = SimplifiedTimesheetTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)