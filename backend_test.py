#!/usr/bin/env python3
"""
Backend API Testing for Supreme Hospitality SOPs & Compliance Document Generator
Tests all critical APIs: Authentication, Categories, Dashboard, Documents CRUD, AI Generation, Export, Templates
"""

import requests
import json
from datetime import datetime
import sys
import time

# Get backend URL from frontend .env
BACKEND_URL = "https://supreme-sop-gen.preview.emergentagent.com/api"

class SOPGeneratorAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        self.created_document_id = None
        self.created_template_id = None
        
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
    
    def test_authentication_api(self):
        """Test 1: Authentication API - Login with phone/PIN"""
        print("\n=== Testing Authentication API ===")
        
        # Test 1a: Valid login with admin credentials
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "identifier": "0457802302",
                "pin": "1234"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user") and data.get("token"):
                    user = data["user"]
                    self.auth_token = data["token"]
                    self.log_test("Valid admin login", True, 
                                f"User: {user.get('first_name')} {user.get('last_name')}, Role: {user.get('role')}")
                else:
                    self.log_test("Valid admin login", False, 
                                f"Missing required fields in response: {data}")
            else:
                self.log_test("Valid admin login", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Valid admin login", False, f"Exception: {str(e)}")
        
        # Test 1b: Invalid PIN should return 401
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "identifier": "0457802302",
                "pin": "9999"  # Wrong PIN
            })
            
            if response.status_code == 401:
                self.log_test("Invalid PIN rejection", True, f"Status: {response.status_code}")
            else:
                self.log_test("Invalid PIN rejection", False, 
                            f"Expected 401, got {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Invalid PIN rejection", False, f"Exception: {str(e)}")
        
        # Test 1c: Non-existent user should return 404
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "identifier": "0999999999",
                "pin": "1234"
            })
            
            if response.status_code == 404:
                self.log_test("Non-existent user rejection", True, f"Status: {response.status_code}")
            else:
                self.log_test("Non-existent user rejection", False, 
                            f"Expected 404, got {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Non-existent user rejection", False, f"Exception: {str(e)}")
    
    def test_categories_api(self):
        """Test 2: Categories API"""
        print("\n=== Testing Categories API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/categories")
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) == 8:
                    # Check for required fields in first category
                    first_cat = categories[0]
                    required_fields = ["id", "name", "icon", "color", "description"]
                    missing_fields = [field for field in required_fields if field not in first_cat]
                    
                    if not missing_fields:
                        category_names = [cat.get("name", "") for cat in categories]
                        self.log_test("Categories API", True, 
                                    f"Found 8 categories: {', '.join(category_names[:3])}...")
                    else:
                        self.log_test("Categories API", False, 
                                    f"Missing fields in category: {missing_fields}")
                else:
                    self.log_test("Categories API", False, 
                                f"Expected 8 categories, got {len(categories) if isinstance(categories, list) else 'invalid response'}")
            else:
                self.log_test("Categories API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Categories API", False, f"Exception: {str(e)}")
    
    def test_dashboard_stats_api(self):
        """Test 3: Dashboard Stats API"""
        print("\n=== Testing Dashboard Stats API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                required_fields = ["total_documents", "published_documents", "draft_documents", 
                                 "total_templates", "category_counts", "recent_documents"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    stats = {
                        "total_docs": data.get("total_documents", 0),
                        "published": data.get("published_documents", 0),
                        "drafts": data.get("draft_documents", 0),
                        "templates": data.get("total_templates", 0),
                        "recent_count": len(data.get("recent_documents", []))
                    }
                    self.log_test("Dashboard Stats API", True, 
                                f"Total: {stats['total_docs']}, Published: {stats['published']}, Drafts: {stats['drafts']}, Templates: {stats['templates']}, Recent: {stats['recent_count']}")
                else:
                    self.log_test("Dashboard Stats API", False, 
                                f"Missing required fields: {missing_fields}")
            else:
                self.log_test("Dashboard Stats API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Dashboard Stats API", False, f"Exception: {str(e)}")
    
    def test_documents_crud_api(self):
        """Test 4: Documents CRUD API"""
        print("\n=== Testing Documents CRUD API ===")
        
        # Test 4a: Create document
        try:
            document_data = {
                "title": "Test Room Cleaning SOP",
                "category": "housekeeping",
                "content": "Test SOP for room cleaning procedures",
                "sections": [
                    {"title": "Preparation", "content": "Gather cleaning supplies", "order": 1},
                    {"title": "Cleaning Process", "content": "Clean room systematically", "order": 2}
                ],
                "status": "draft"
            }
            
            response = self.session.post(f"{BACKEND_URL}/documents", json=document_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") and data.get("title") == document_data["title"]:
                    self.created_document_id = data["id"]
                    self.log_test("Create document", True, 
                                f"Created document ID: {self.created_document_id}")
                else:
                    self.log_test("Create document", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Create document", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create document", False, f"Exception: {str(e)}")
        
        # Test 4b: Get all documents
        try:
            response = self.session.get(f"{BACKEND_URL}/documents")
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    self.log_test("Get all documents", True, 
                                f"Found {len(documents)} documents")
                else:
                    self.log_test("Get all documents", False, 
                                f"Expected list, got: {type(documents)}")
            else:
                self.log_test("Get all documents", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get all documents", False, f"Exception: {str(e)}")
        
        # Test 4c: Get documents with category filter
        try:
            response = self.session.get(f"{BACKEND_URL}/documents?category=housekeeping")
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    housekeeping_docs = [d for d in documents if d.get("category") == "housekeeping"]
                    self.log_test("Get documents by category", True, 
                                f"Found {len(housekeeping_docs)} housekeeping documents")
                else:
                    self.log_test("Get documents by category", False, 
                                f"Expected list, got: {type(documents)}")
            else:
                self.log_test("Get documents by category", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get documents by category", False, f"Exception: {str(e)}")
        
        # Test 4d: Get documents with status filter
        try:
            response = self.session.get(f"{BACKEND_URL}/documents?status=draft")
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    draft_docs = [d for d in documents if d.get("status") == "draft"]
                    self.log_test("Get documents by status", True, 
                                f"Found {len(draft_docs)} draft documents")
                else:
                    self.log_test("Get documents by status", False, 
                                f"Expected list, got: {type(documents)}")
            else:
                self.log_test("Get documents by status", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get documents by status", False, f"Exception: {str(e)}")
        
        # Test 4e: Get documents with search filter
        try:
            response = self.session.get(f"{BACKEND_URL}/documents?search=cleaning")
            
            if response.status_code == 200:
                documents = response.json()
                if isinstance(documents, list):
                    self.log_test("Get documents by search", True, 
                                f"Found {len(documents)} documents matching 'cleaning'")
                else:
                    self.log_test("Get documents by search", False, 
                                f"Expected list, got: {type(documents)}")
            else:
                self.log_test("Get documents by search", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get documents by search", False, f"Exception: {str(e)}")
        
        # Test 4f: Get single document
        if self.created_document_id:
            try:
                response = self.session.get(f"{BACKEND_URL}/documents/{self.created_document_id}")
                
                if response.status_code == 200:
                    document = response.json()
                    if document.get("id") == self.created_document_id:
                        self.log_test("Get single document", True, 
                                    f"Retrieved document: {document.get('title')}")
                    else:
                        self.log_test("Get single document", False, 
                                    f"ID mismatch: expected {self.created_document_id}, got {document.get('id')}")
                else:
                    self.log_test("Get single document", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Get single document", False, f"Exception: {str(e)}")
        
        # Test 4g: Update document (change status to published)
        if self.created_document_id:
            try:
                update_data = {"status": "published"}
                response = self.session.put(f"{BACKEND_URL}/documents/{self.created_document_id}", 
                                          json=update_data)
                
                if response.status_code == 200:
                    document = response.json()
                    if document.get("status") == "published":
                        self.log_test("Update document", True, 
                                    f"Status changed to: {document.get('status')}")
                    else:
                        self.log_test("Update document", False, 
                                    f"Status not updated: {document.get('status')}")
                else:
                    self.log_test("Update document", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Update document", False, f"Exception: {str(e)}")
    
    def test_ai_generation_api(self):
        """Test 5: AI Document Generation API (with longer timeout)"""
        print("\n=== Testing AI Document Generation API ===")
        
        try:
            generation_data = {
                "category": "housekeeping",
                "document_type": "sop",
                "title": "Test Room Cleaning SOP",
                "sections_count": 3
            }
            
            # Use longer timeout for AI generation (60 seconds)
            response = self.session.post(f"{BACKEND_URL}/documents/generate", 
                                       json=generation_data, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("document"):
                    document = data["document"]
                    sections_count = len(document.get("sections", []))
                    self.log_test("AI Document Generation", True, 
                                f"Generated document: {document.get('title')}, Sections: {sections_count}")
                    
                    # Store the generated document ID for export test
                    if not self.created_document_id:
                        self.created_document_id = document.get("id")
                else:
                    self.log_test("AI Document Generation", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("AI Document Generation", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except requests.exceptions.Timeout:
            self.log_test("AI Document Generation", False, "Request timed out after 60 seconds")
        except Exception as e:
            self.log_test("AI Document Generation", False, f"Exception: {str(e)}")
    
    def test_document_export_api(self):
        """Test 6: Document Export API (HTML)"""
        print("\n=== Testing Document Export API ===")
        
        if not self.created_document_id:
            self.log_test("Document Export", False, "No document ID available for export test")
            return
        
        try:
            response = self.session.get(f"{BACKEND_URL}/documents/{self.created_document_id}/export")
            
            if response.status_code == 200:
                html_content = response.text
                # Check for Supreme Hospitality branding
                if "SUPREME HOSPITALITY" in html_content and "<!DOCTYPE html>" in html_content:
                    # Check for print styles
                    has_print_styles = "@media print" in html_content
                    self.log_test("Document Export", True, 
                                f"HTML export successful, Print styles: {has_print_styles}, Length: {len(html_content)} chars")
                else:
                    self.log_test("Document Export", False, 
                                f"Missing branding or invalid HTML structure")
            else:
                self.log_test("Document Export", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Document Export", False, f"Exception: {str(e)}")
    
    def test_templates_crud_api(self):
        """Test 7: Templates CRUD API"""
        print("\n=== Testing Templates CRUD API ===")
        
        # Test 7a: Create template
        try:
            template_data = {
                "name": "Test Housekeeping Template",
                "category": "housekeeping",
                "description": "Template for housekeeping SOPs",
                "sections": [
                    {"title": "Preparation", "content": "Template preparation steps", "order": 1},
                    {"title": "Execution", "content": "Template execution steps", "order": 2}
                ]
            }
            
            response = self.session.post(f"{BACKEND_URL}/templates", json=template_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") and data.get("name") == template_data["name"]:
                    self.created_template_id = data["id"]
                    self.log_test("Create template", True, 
                                f"Created template ID: {self.created_template_id}")
                else:
                    self.log_test("Create template", False, 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Create template", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create template", False, f"Exception: {str(e)}")
        
        # Test 7b: Get all templates
        try:
            response = self.session.get(f"{BACKEND_URL}/templates")
            
            if response.status_code == 200:
                templates = response.json()
                if isinstance(templates, list):
                    self.log_test("Get all templates", True, 
                                f"Found {len(templates)} templates")
                else:
                    self.log_test("Get all templates", False, 
                                f"Expected list, got: {type(templates)}")
            else:
                self.log_test("Get all templates", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get all templates", False, f"Exception: {str(e)}")
        
        # Test 7c: Update template
        if self.created_template_id:
            try:
                update_data = {"description": "Updated template description"}
                response = self.session.put(f"{BACKEND_URL}/templates/{self.created_template_id}", 
                                          json=update_data)
                
                if response.status_code == 200:
                    template = response.json()
                    if template.get("description") == update_data["description"]:
                        self.log_test("Update template", True, 
                                    f"Description updated successfully")
                    else:
                        self.log_test("Update template", False, 
                                    f"Description not updated: {template.get('description')}")
                else:
                    self.log_test("Update template", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Update template", False, f"Exception: {str(e)}")
        
        # Test 7d: Delete template
        if self.created_template_id:
            try:
                response = self.session.delete(f"{BACKEND_URL}/templates/{self.created_template_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_test("Delete template", True, 
                                    f"Template deleted successfully")
                    else:
                        self.log_test("Delete template", False, 
                                    f"Success flag false: {data}")
                else:
                    self.log_test("Delete template", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Delete template", False, f"Exception: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning up test data ===")
        
        # Delete created document
        if self.created_document_id:
            try:
                response = self.session.delete(f"{BACKEND_URL}/documents/{self.created_document_id}")
                if response.status_code == 200:
                    self.log_test("Cleanup - Delete document", True, "Test document deleted")
                else:
                    self.log_test("Cleanup - Delete document", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Cleanup - Delete document", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Testing for Supreme Hospitality SOPs & Compliance Generator")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Run all tests in order
        self.test_authentication_api()
        self.test_categories_api()
        self.test_dashboard_stats_api()
        self.test_documents_crud_api()
        self.test_ai_generation_api()
        self.test_document_export_api()
        self.test_templates_crud_api()
        
        # Cleanup
        self.cleanup_test_data()
        
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
    tester = SOPGeneratorAPITester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")