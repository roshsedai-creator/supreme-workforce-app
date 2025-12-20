#!/usr/bin/env python3
"""
Focused Roster Management API Testing
Tests the specific roster management functionality requested
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://workforce-doctor.preview.emergentagent.com/api"

# Test accounts
ADMIN_ACCOUNT = {"phone": "0457802302", "pin": "1234"}
EMMA_ACCOUNT = {"phone": "0423456789", "pin": "1111"}
LISA_ACCOUNT = {"phone": "0445678901", "pin": "3333"}  # Employee without current roster

def login_user(account):
    """Login and get user ID"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "identifier": account["phone"],
        "pin": account["pin"]
    })
    
    if response.status_code == 200:
        return response.json()["user"]
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_roster_apis():
    """Test all roster management APIs"""
    print("🚀 FOCUSED ROSTER MANAGEMENT API TESTING")
    print("=" * 60)
    
    # Login users
    admin = login_user(ADMIN_ACCOUNT)
    emma = login_user(EMMA_ACCOUNT)
    lisa = login_user(LISA_ACCOUNT)
    
    if not admin or not emma or not lisa:
        print("❌ Failed to login required users")
        return
    
    print(f"✅ Logged in: Admin ({admin['first_name']}), Emma ({emma['first_name']}), Lisa ({lisa['first_name']})")
    
    # Get sites
    sites_response = requests.get(f"{BASE_URL}/sites")
    sites = sites_response.json()
    site = sites[0]
    
    print(f"✅ Using site: {site['name']}")
    
    # Test 1: Get all roster shifts with enrichment
    print("\n📅 Test 1: GET /api/roster/shifts (all shifts)")
    response = requests.get(f"{BASE_URL}/roster/shifts")
    
    if response.status_code == 200:
        shifts = response.json()
        print(f"✅ Retrieved {len(shifts)} roster shifts")
        
        if shifts and "employee_name" in shifts[0] and "site_name" in shifts[0]:
            print(f"✅ Shifts enriched with employee_name and site_name")
            print(f"   Sample: {shifts[0]['employee_name']} at {shifts[0]['site_name']} on {shifts[0]['start_time'][:10]}")
        else:
            print("❌ Missing enrichment data")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 2: Create new roster shift
    print("\n📅 Test 2: POST /api/roster/shifts (create shift)")
    tomorrow = datetime.now() + timedelta(days=1)
    start_time = tomorrow.replace(hour=8, minute=0, second=0, microsecond=0)
    end_time = tomorrow.replace(hour=16, minute=0, second=0, microsecond=0)
    
    shift_data = {
        "employee_id": emma["id"],
        "site_id": site["id"],
        "role": "Room Attendant",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "notes": "Test shift created by backend testing"
    }
    
    response = requests.post(f"{BASE_URL}/roster/shifts?created_by={admin['id']}", json=shift_data)
    
    if response.status_code == 200:
        new_shift = response.json()
        test_shift_id = new_shift["id"]
        print(f"✅ Created shift ID: {test_shift_id}")
        print(f"   Time: {new_shift['start_time']} to {new_shift['end_time']}")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")
        return
    
    # Test 3: Update roster shift
    print("\n📅 Test 3: PUT /api/roster/shifts/{id} (update shift)")
    new_end_time = tomorrow.replace(hour=17, minute=0, second=0, microsecond=0)
    update_data = {
        "end_time": new_end_time.isoformat(),
        "notes": "Updated by backend testing - extended to 5pm"
    }
    
    response = requests.put(f"{BASE_URL}/roster/shifts/{test_shift_id}", json=update_data)
    
    if response.status_code == 200:
        updated_shift = response.json()
        print(f"✅ Updated shift successfully")
        print(f"   New end time: {updated_shift['end_time']}")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 4: Filter shifts by employee
    print("\n📅 Test 4: GET /api/roster/shifts?employee_id=... (filter)")
    response = requests.get(f"{BASE_URL}/roster/shifts?employee_id={emma['id']}")
    
    if response.status_code == 200:
        emma_shifts = response.json()
        print(f"✅ Found {len(emma_shifts)} shifts for Emma")
        if emma_shifts:
            print(f"   Sample: {emma_shifts[0]['employee_name']} at {emma_shifts[0]['site_name']}")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 5: Get Emma's availability
    print("\n🗓️ Test 5: GET /api/availability/{employee_id} (Emma's availability)")
    response = requests.get(f"{BASE_URL}/availability/{emma['id']}")
    
    if response.status_code == 200:
        availability = response.json()
        print(f"✅ Retrieved {len(availability)} availability records for Emma")
        
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for avail in availability[:3]:  # Show first 3
            day_name = day_names[avail["day_of_week"]]
            if avail["available"]:
                print(f"   {day_name}: Available {avail.get('start_time', 'N/A')} - {avail.get('end_time', 'N/A')}")
            else:
                print(f"   {day_name}: Not available")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 6: Update Emma's availability
    print("\n🗓️ Test 6: POST /api/availability (update availability)")
    availability_data = {
        "employee_id": emma["id"],
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
    
    response = requests.post(f"{BASE_URL}/availability", json=availability_data)
    
    if response.status_code == 200:
        print(f"✅ Updated Emma's availability successfully")
        print(f"   Monday: Unavailable, Tue-Fri: 9am-5pm, Weekends: Unavailable")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 7: Add unavailable date
    print("\n🗓️ Test 7: POST /api/availability/unavailable-dates (add unavailable date)")
    unavailable_date = datetime.now() + timedelta(days=14)
    
    unavailable_data = {
        "employee_id": emma["id"],
        "date": unavailable_date.isoformat(),
        "reason": "Personal appointment - backend testing"
    }
    
    response = requests.post(f"{BASE_URL}/availability/unavailable-dates", json=unavailable_data)
    
    if response.status_code == 200:
        unavailable_result = response.json()
        test_unavailable_id = unavailable_result["id"]
        print(f"✅ Added unavailable date ID: {test_unavailable_id}")
        print(f"   Date: {unavailable_result['date'][:10]}, Reason: {unavailable_result['reason']}")
    else:
        print(f"❌ Failed: {response.status_code}")
        test_unavailable_id = None
    
    # Test 8: Get unavailable dates
    print("\n🗓️ Test 8: GET /api/availability/unavailable-dates/{employee_id}")
    response = requests.get(f"{BASE_URL}/availability/unavailable-dates/{emma['id']}")
    
    if response.status_code == 200:
        dates = response.json()
        print(f"✅ Retrieved {len(dates)} unavailable dates for Emma")
        for date in dates:
            print(f"   {date['date'][:10]}: {date.get('reason', 'No reason')}")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 9: Clock-in validation - WITHOUT roster (should fail)
    print("\n🔒 Test 9: Clock-in WITHOUT rostered shift (should fail with 403)")
    
    # First ensure Lisa is clocked out
    requests.post(f"{BASE_URL}/timesheets/clock-out", json={
        "timesheet_id": "dummy_id",
        "gps_lat": site["gps_lat"],
        "gps_long": site["gps_long"]
    })  # This will fail but that's ok
    
    clock_in_data = {
        "employee_id": lisa["id"],  # Lisa has no current roster
        "site_id": site["id"],
        "gps_lat": site["gps_lat"],
        "gps_long": site["gps_long"]
    }
    
    response = requests.post(f"{BASE_URL}/timesheets/clock-in", json=clock_in_data)
    
    if response.status_code == 403:
        error_data = response.json()
        if "not rostered" in error_data.get("detail", "").lower():
            print(f"✅ Correctly blocked clock-in without roster")
            print(f"   Error: {error_data['detail']}")
        else:
            print(f"❌ Wrong error message: {error_data.get('detail')}")
    else:
        print(f"❌ Expected 403, got {response.status_code}")
    
    # Test 10: Clock-in validation - WITH roster (should succeed)
    print("\n🔒 Test 10: Clock-in WITH rostered shift (should succeed)")
    
    # First ensure Emma is clocked out
    requests.post(f"{BASE_URL}/timesheets/clock-out", json={
        "timesheet_id": "6937d99d43ce337afaca5646",  # From previous test
        "gps_lat": site["gps_lat"],
        "gps_long": site["gps_long"]
    })
    
    clock_in_data["employee_id"] = emma["id"]  # Emma has current roster
    
    response = requests.post(f"{BASE_URL}/timesheets/clock-in", json=clock_in_data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success") and result.get("timesheet"):
            timesheet = result["timesheet"]
            roster_shift_id = timesheet.get("roster_shift_id")
            print(f"✅ Successfully clocked in with roster validation")
            print(f"   Timesheet ID: {timesheet['id']}")
            print(f"   Linked to roster shift: {roster_shift_id}")
            
            # Clean up - clock out
            requests.post(f"{BASE_URL}/timesheets/clock-out", json={
                "timesheet_id": timesheet["id"],
                "gps_lat": site["gps_lat"],
                "gps_long": site["gps_long"]
            })
            print(f"✅ Cleaned up - clocked out")
        else:
            print(f"❌ Missing success or timesheet in response")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")
    
    # Test 11: Delete test shift
    print("\n📅 Test 11: DELETE /api/roster/shifts/{id} (delete test shift)")
    response = requests.delete(f"{BASE_URL}/roster/shifts/{test_shift_id}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Deleted test shift successfully")
    else:
        print(f"❌ Failed: {response.status_code}")
    
    # Test 12: Delete unavailable date
    if test_unavailable_id:
        print("\n🗓️ Test 12: DELETE /api/availability/unavailable-dates/{id}")
        response = requests.delete(f"{BASE_URL}/availability/unavailable-dates/{test_unavailable_id}")
        
        if response.status_code == 200:
            print(f"✅ Deleted unavailable date successfully")
        else:
            print(f"❌ Failed: {response.status_code}")
    
    print("\n🎉 ROSTER MANAGEMENT TESTING COMPLETED!")

if __name__ == "__main__":
    test_roster_apis()