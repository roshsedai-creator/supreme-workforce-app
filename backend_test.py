#!/usr/bin/env python3
"""
Backend API Testing for Timesheet & Workforce Management App
Tests critical APIs: Authentication, Manual Timesheet Creation, Timesheet Delete, Supervisor Dashboard
"""

import requests
import json
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://timewizard-12.preview.emergentagent.com/api"

class TimesheetAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def test_authentication_login(self):
        """Test 1: Authentication - Login API"""
        print("\n=== Testing Authentication Login API ===")
        
        # Test 1a: Valid login with employee credentials
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "identifier": "0433708550",
                "pin": "4748"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user") and data.get("token"):
                    self.log_test("Valid login with employee credentials", True, 
                                f"Status: {response.status_code}, User: {data['user'].get('first_name', 'Unknown')}")
                else:
                    self.log_test("Valid login with employee credentials", False, 
                                f"Missing required fields in response: {data}")
            else:
                self.log_test("Valid login with employee credentials", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Valid login with employee credentials", False, f"Exception: {str(e)}")
        
        # Test 1b: Invalid PIN should return 401
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "identifier": "0433708550",
                "pin": "9999"  # Wrong PIN
            })
            
            if response.status_code == 401:
                self.log_test("Invalid PIN rejection", True, f"Status: {response.status_code}")
            else:
                self.log_test("Invalid PIN rejection", False, 
                            f"Expected 401, got {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Invalid PIN rejection", False, f"Exception: {str(e)}")
    
    def test_manual_timesheet_creation(self):
        """Test 2: Manual Timesheet Creation API (CRITICAL - Timezone handling)"""
        print("\n=== Testing Manual Timesheet Creation API ===")
        
        try:
            # Create manual timesheet with local datetime strings (no timezone)
            timesheet_data = {
                "employee_id": "6946008e4d67d45754c55f12",
                "site_id": "6937ab02ed93a77515eb99de", 
                "clock_in": "2025-12-20T09:00:00",
                "clock_out": "2025-12-20T17:00:00",
                "break_minutes": 30,
                "notes": "Test manual entry"
            }
            
            response = self.session.post(f"{BACKEND_URL}/timesheets/manual", json=timesheet_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("timesheet"):
                    timesheet = data["timesheet"]
                    
                    # Check timezone handling - clock_in should remain as "2025-12-20T09:00:00"
                    clock_in_response = timesheet.get("clock_in", "")
                    expected_clock_in = "2025-12-20T09:00:00"
                    
                    # Remove any timezone info for comparison
                    if "T" in clock_in_response:
                        clock_in_clean = clock_in_response.split("T")[0] + "T" + clock_in_response.split("T")[1].split("+")[0].split("Z")[0]
                    else:
                        clock_in_clean = clock_in_response
                    
                    timezone_correct = expected_clock_in in clock_in_clean
                    
                    # Check total hours calculation (8 hours - 0.5 hour break = 7.5 hours)
                    total_hours = timesheet.get("total_hours", 0)
                    hours_correct = total_hours == 7.5
                    
                    if timezone_correct and hours_correct:
                        self.log_test("Manual timesheet creation with timezone handling", True, 
                                    f"Clock_in: {clock_in_response}, Total_hours: {total_hours}")
                    else:
                        self.log_test("Manual timesheet creation with timezone handling", False, 
                                    f"Timezone OK: {timezone_correct}, Hours OK: {hours_correct}, Clock_in: {clock_in_response}, Total_hours: {total_hours}")
                    
                    # Store timesheet ID for delete test
                    self.created_timesheet_id = timesheet.get("id")
                    
                else:
                    self.log_test("Manual timesheet creation with timezone handling", False, 
                                f"Missing success or timesheet in response: {data}")
            else:
                self.log_test("Manual timesheet creation with timezone handling", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Manual timesheet creation with timezone handling", False, f"Exception: {str(e)}")
    
    def test_timesheet_delete_api(self):
        """Test 3: Timesheet Delete API"""
        print("\n=== Testing Timesheet Delete API ===")
        
        # Test 3a: Get timesheets to find an ID
        try:
            response = self.session.get(f"{BACKEND_URL}/timesheets")
            
            if response.status_code == 200:
                timesheets = response.json()
                if isinstance(timesheets, list) and len(timesheets) > 0:
                    # Use the timesheet we created, or the first one available
                    timesheet_id = getattr(self, 'created_timesheet_id', timesheets[0].get('id'))
                    self.log_test("Get timesheets for delete test", True, 
                                f"Found {len(timesheets)} timesheets, using ID: {timesheet_id}")
                    
                    # Test 3b: Delete valid timesheet
                    if timesheet_id:
                        try:
                            delete_response = self.session.delete(f"{BACKEND_URL}/timesheets/{timesheet_id}")
                            
                            if delete_response.status_code == 200:
                                delete_data = delete_response.json()
                                if delete_data.get("success"):
                                    self.log_test("Delete valid timesheet", True, 
                                                f"Status: {delete_response.status_code}")
                                else:
                                    self.log_test("Delete valid timesheet", False, 
                                                f"Success flag false: {delete_data}")
                            else:
                                self.log_test("Delete valid timesheet", False, 
                                            f"Status: {delete_response.status_code}, Response: {delete_response.text}")
                        except Exception as e:
                            self.log_test("Delete valid timesheet", False, f"Exception: {str(e)}")
                    
                else:
                    self.log_test("Get timesheets for delete test", False, 
                                f"No timesheets found or invalid response: {timesheets}")
            else:
                self.log_test("Get timesheets for delete test", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get timesheets for delete test", False, f"Exception: {str(e)}")
        
        # Test 3c: Delete invalid timesheet ID should return 404
        try:
            response = self.session.delete(f"{BACKEND_URL}/timesheets/invalid_id_12345")
            
            if response.status_code == 404:
                self.log_test("Delete invalid timesheet ID", True, f"Status: {response.status_code}")
            else:
                self.log_test("Delete invalid timesheet ID", False, 
                            f"Expected 404, got {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Delete invalid timesheet ID", False, f"Exception: {str(e)}")
    
    def test_supervisor_dashboard_api(self):
        """Test 4: Supervisor Dashboard API"""
        print("\n=== Testing Supervisor Dashboard API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/supervisor")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                has_pending_approvals = "pending_approvals" in data
                has_active_employees = "active_employees" in data
                
                if has_pending_approvals and has_active_employees:
                    # These are integers, not arrays
                    pending_count = data.get("pending_approvals", 0)
                    active_count = data.get("active_employees", 0)
                    
                    # Also check for the arrays that contain the actual data
                    has_pending_timesheets = "pending_timesheets" in data
                    has_active_timesheets = "active_timesheets" in data
                    
                    if has_pending_timesheets and has_active_timesheets:
                        self.log_test("Supervisor dashboard API", True, 
                                    f"Pending approvals: {pending_count}, Active employees: {active_count}, Has data arrays: Yes")
                    else:
                        self.log_test("Supervisor dashboard API", False, 
                                    f"Missing data arrays - pending_timesheets: {has_pending_timesheets}, active_timesheets: {has_active_timesheets}")
                else:
                    missing_fields = []
                    if not has_pending_approvals:
                        missing_fields.append("pending_approvals")
                    if not has_active_employees:
                        missing_fields.append("active_employees")
                    
                    self.log_test("Supervisor dashboard API", False, 
                                f"Missing required fields: {missing_fields}, Response: {data}")
            else:
                self.log_test("Supervisor dashboard API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Supervisor dashboard API", False, f"Exception: {str(e)}")
    
    def test_smart_dashboard_api(self):
        """Test 5: Smart Dashboard API for employee"""
        print("\n=== Testing Smart Dashboard API ===")
        
        # Test employee ID from review request
        employee_id = "69461c4be9693ef7e04bdc12"  # Nagita nagita
        
        try:
            response = self.session.get(f"{BACKEND_URL}/employee/smart-dashboard/{employee_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields are present
                required_fields = ["success", "employee_name", "this_week", "performance", "alerts"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Smart Dashboard API", False, f"Missing required fields: {missing_fields}")
                    return
                
                # Verify this_week structure
                this_week = data.get("this_week", {})
                week_required = ["hours_worked", "earnings_estimate", "shifts_completed", "overtime_hours", "approaching_overtime"]
                week_missing = [field for field in week_required if field not in this_week]
                
                if week_missing:
                    self.log_test("Smart Dashboard API - this_week", False, f"Missing this_week fields: {week_missing}")
                    return
                
                # Verify performance structure
                performance = data.get("performance", {})
                perf_required = ["punctuality_score", "current_streak", "total_shifts_30d"]
                perf_missing = [field for field in perf_required if field not in performance]
                
                if perf_missing:
                    self.log_test("Smart Dashboard API - performance", False, f"Missing performance fields: {perf_missing}")
                    return
                
                # Success - log detailed results
                employee_name = data.get("employee_name")
                hours_worked = this_week.get("hours_worked")
                earnings = this_week.get("earnings_estimate")
                shifts = this_week.get("shifts_completed")
                overtime = this_week.get("overtime_hours")
                
                punctuality = performance.get("punctuality_score")
                streak = performance.get("current_streak")
                total_shifts = performance.get("total_shifts_30d")
                
                alerts_count = len(data.get("alerts", []))
                next_shift = data.get("next_shift")
                
                details = f"Employee: {employee_name}, This Week: {hours_worked}h worked, ${earnings} estimated, {shifts} shifts, Performance: {punctuality}% punctuality, {streak} day streak, {alerts_count} alerts"
                
                self.log_test("Smart Dashboard API", True, details)
                
            elif response.status_code == 404:
                self.log_test("Smart Dashboard API", False, f"Employee not found (ID: {employee_id})")
            else:
                self.log_test("Smart Dashboard API", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Smart Dashboard API", False, f"Exception: {str(e)}")
    
    def test_live_sites_status_api(self):
        """Test 6: Live Sites Status API"""
        print("\n=== Testing Live Sites Status API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/sites/live-status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["success", "timestamp", "total_active", "sites"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Live Sites Status API", False, f"Missing required fields: {missing_fields}")
                    return
                
                sites = data.get("sites", [])
                total_active = data.get("total_active", 0)
                timestamp = data.get("timestamp")
                
                # Verify site structure if sites exist
                if sites:
                    site = sites[0]
                    site_required = ["id", "name", "active_count", "active_employees"]
                    site_missing = [field for field in site_required if field not in site]
                    
                    if site_missing:
                        self.log_test("Live Sites Status API", False, f"Missing site fields: {site_missing}")
                        return
                
                details = f"Total Active: {total_active}, Sites: {len(sites)}, Timestamp: {timestamp}"
                if sites:
                    details += f", Sample Site: {sites[0]['name']} ({sites[0]['active_count']} active)"
                
                self.log_test("Live Sites Status API", True, details)
                
            else:
                self.log_test("Live Sites Status API", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Live Sites Status API", False, f"Exception: {str(e)}")
    
    def test_login_with_review_credentials(self):
        """Test 7: Login API with review request credentials"""
        print("\n=== Testing Login API with Review Credentials ===")
        
        # Test credentials from review request
        test_credentials = {
            "identifier": "0420576508",  # Nagita nagita
            "pin": "2003"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=test_credentials)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user") and data.get("token"):
                    user = data["user"]
                    self.log_test("Login API (Review Credentials)", True, 
                                f"Successfully logged in: {user.get('first_name')} {user.get('last_name')} (ID: {user.get('id')})")
                else:
                    self.log_test("Login API (Review Credentials)", False, f"Invalid response structure: {data}")
            elif response.status_code == 401:
                self.log_test("Login API (Review Credentials)", False, "Invalid PIN")
            elif response.status_code == 404:
                self.log_test("Login API (Review Credentials)", False, "User not found")
            else:
                self.log_test("Login API (Review Credentials)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Login API (Review Credentials)", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Testing for Timesheet & Workforce Management App")
        print("🆕 Including Smart Dashboard Feature Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Run all tests
        self.test_authentication_login()
        self.test_manual_timesheet_creation()
        self.test_timesheet_delete_api()
        self.test_supervisor_dashboard_api()
        
        # NEW: Smart Dashboard Feature Tests
        self.test_login_with_review_credentials()
        self.test_smart_dashboard_api()
        self.test_live_sites_status_api()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = TimesheetAPITester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")