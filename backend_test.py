#!/usr/bin/env python3
"""
Backend API Testing for Supreme Compliance Document Generator
Tests all backend APIs with focus on Document Export API (recently upgraded)
"""

import requests
import json
import time
import re
from datetime import datetime

# Configuration
BASE_URL = "https://supreme-sop-gen.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {
    "identifier": "0457802302",
    "pin": "1234"
}

# Test document IDs mentioned in the review request
TEST_DOCUMENT_IDS = [
    "69cc875929c539cf32bbfb15",  # SWMS document
    "69cc7b954dd43571e8f6d4cd"   # SOP document
]

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_auth_login(self):
        """Test authentication API"""
        print("\n=== TESTING AUTHENTICATION API ===")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    self.log_test("Admin Login", True, f"Successfully logged in as {data.get('user', {}).get('first_name', 'Admin')}")
                    return True
                else:
                    self.log_test("Admin Login", True, f"Login successful without token (PIN-based auth). User: {data.get('user', {}).get('first_name', 'Admin')}")
                    return True
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def test_categories_api(self):
        """Test categories API"""
        print("\n=== TESTING CATEGORIES API ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/categories", timeout=30)
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) >= 8:
                    # Check if categories have required fields
                    required_fields = ["id", "name", "icon", "color", "description"]
                    valid_categories = all(
                        all(field in cat for field in required_fields) 
                        for cat in categories
                    )
                    
                    if valid_categories:
                        self.log_test("Categories API", True, f"Retrieved {len(categories)} categories with all required fields")
                        return True
                    else:
                        self.log_test("Categories API", False, "Categories missing required fields")
                        return False
                else:
                    self.log_test("Categories API", False, f"Expected at least 8 categories, got {len(categories) if isinstance(categories, list) else 'invalid response'}")
                    return False
            else:
                self.log_test("Categories API", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Categories API", False, f"Exception: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard stats API"""
        print("\n=== TESTING DASHBOARD STATS API ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/stats", timeout=30)
            
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["total_documents", "published_documents", "draft_documents", "total_templates", "category_counts", "recent_documents"]
                
                if all(field in stats for field in required_fields):
                    self.log_test("Dashboard Stats", True, f"All required fields present. Total docs: {stats.get('total_documents', 0)}")
                    return True
                else:
                    missing_fields = [field for field in required_fields if field not in stats]
                    self.log_test("Dashboard Stats", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Dashboard Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Exception: {str(e)}")
            return False
    
    def test_documents_list(self):
        """Test documents list API"""
        print("\n=== TESTING DOCUMENTS LIST API ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/documents", timeout=30)
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    self.log_test("Documents List", True, f"Retrieved {len(documents)} documents")
                    return True, documents
                else:
                    self.log_test("Documents List", False, "Response is not a list")
                    return False, []
            else:
                self.log_test("Documents List", False, f"HTTP {response.status_code}: {response.text}")
                return False, []
                
        except Exception as e:
            self.log_test("Documents List", False, f"Exception: {str(e)}")
            return False, []
    
    def test_document_export_api(self, doc_id, doc_type="Unknown"):
        """Test document export API - HIGH PRIORITY"""
        print(f"\n=== TESTING DOCUMENT EXPORT API ({doc_type}) ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/documents/{doc_id}/export", timeout=60)
            
            if response.status_code == 200:
                html_content = response.text
                
                # Verify required elements in HTML
                checks = {
                    "SUPREME COMPLIANCE branding": "SUPREME COMPLIANCE" in html_content,
                    "Document Control grid": "Document Reference" in html_content and "Version" in html_content and "Issue Date" in html_content,
                    "Table of Contents": "TABLE OF CONTENTS" in html_content or "Table of Contents" in html_content,
                    "Sign-off section": "Document Approval" in html_content and "Prepared By" in html_content and "Reviewed By" in html_content and "Approved By" in html_content and "Authorised By" in html_content,
                    "Revision History": "REVISION HISTORY" in html_content or "Revision History" in html_content,
                    "Print styles": "@media print" in html_content,
                    "No raw markdown": "---" not in html_content and "|---|" not in html_content,
                    "HTML tables": "<table>" in html_content and "<thead>" in html_content and "<th>" in html_content,
                    "Valid HTML structure": "<!DOCTYPE html>" in html_content and "<html" in html_content and "</html>" in html_content
                }
                
                passed_checks = sum(1 for check in checks.values() if check)
                total_checks = len(checks)
                
                if passed_checks == total_checks:
                    self.log_test(f"Document Export ({doc_type})", True, f"All {total_checks} validation checks passed. HTML length: {len(html_content)} chars")
                    return True
                else:
                    failed_checks = [name for name, passed in checks.items() if not passed]
                    self.log_test(f"Document Export ({doc_type})", False, f"Failed checks: {failed_checks}. Passed: {passed_checks}/{total_checks}")
                    return False
                    
            elif response.status_code == 404:
                self.log_test(f"Document Export ({doc_type})", False, f"Document {doc_id} not found")
                return False
            else:
                self.log_test(f"Document Export ({doc_type})", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"Document Export ({doc_type})", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Testing for Supreme Compliance Document Generator")
        print(f"🌐 Testing against: {BASE_URL}")
        print(f"👤 Admin credentials: {ADMIN_CREDENTIALS['identifier']}")
        
        start_time = time.time()
        
        # Test 1: Authentication
        auth_success = self.test_auth_login()
        if not auth_success:
            print("❌ Authentication failed - cannot proceed with authenticated tests")
            return self.generate_summary()
        
        # Test 2: Categories API
        self.test_categories_api()
        
        # Test 3: Dashboard Stats
        self.test_dashboard_stats()
        
        # Test 4: Documents List
        docs_success, documents = self.test_documents_list()
        
        # Test 5: Document Export API (HIGH PRIORITY)
        print("\n🔥 HIGH PRIORITY: Testing Document Export API")
        
        # Test specific document IDs mentioned in review request
        self.test_document_export_api(TEST_DOCUMENT_IDS[0], "SWMS")
        self.test_document_export_api(TEST_DOCUMENT_IDS[1], "SOP")
        
        # Test any additional documents found
        if docs_success and documents:
            for doc in documents[:2]:  # Test first 2 additional docs
                doc_id = doc.get("id")
                doc_title = doc.get("title", "Unknown")
                if doc_id and doc_id not in TEST_DOCUMENT_IDS:
                    self.test_document_export_api(doc_id, f"Additional ({doc_title[:20]})")
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n⏱️  Total testing time: {duration:.2f} seconds")
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 TEST SUMMARY")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": passed_tests/total_tests*100,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    summary = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: /app/backend_test_results.json")