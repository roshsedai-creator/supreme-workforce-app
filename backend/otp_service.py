"""Mock OTP Service - Replace with real Twilio integration"""
import random
from datetime import datetime, timedelta
from typing import Dict, Optional

# In-memory storage for OTPs (use Redis in production)
otp_storage: Dict[str, Dict] = {}

def generate_otp(phone: str) -> str:
    """Generate a 6-digit OTP"""
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP with expiration
    otp_storage[phone] = {
        'otp': otp,
        'expires_at': datetime.utcnow() + timedelta(minutes=5),
        'attempts': 0
    }
    
    print(f"\n📱 MOCK SMS TO {phone}")
    print(f"Your OTP is: {otp}")
    print(f"Valid for 5 minutes\n")
    
    return otp

def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP code"""
    if phone not in otp_storage:
        return False
    
    stored = otp_storage[phone]
    
    # Check expiration
    if datetime.utcnow() > stored['expires_at']:
        del otp_storage[phone]
        return False
    
    # Check attempts
    if stored['attempts'] >= 3:
        del otp_storage[phone]
        return False
    
    # Verify OTP
    if stored['otp'] == otp:
        del otp_storage[phone]
        return True
    
    # Increment attempts
    stored['attempts'] += 1
    return False

def send_contract_email(employee_email: str, employee_name: str, contract_type: str) -> bool:
    """Mock email sending for contracts"""
    print(f"\n📧 MOCK EMAIL TO: {employee_email}")
    print(f"FROM: info@supremehospitality.com.au")
    print(f"SUBJECT: Your {contract_type.title()} Contract")
    print(f"\nDear {employee_name},")
    print(f"Please find your employment contract attached.")
    print(f"Click the link to review and sign digitally.")
    print(f"\n[MOCK] Email sent successfully!\n")
    return True

def send_invoice_email(employee_email: str, invoice_data: dict) -> bool:
    """Mock email sending for invoices"""
    print(f"\n📧 MOCK EMAIL TO: {employee_email}")
    print(f"FROM: info@supremehospitality.com.au")
    print(f"SUBJECT: Invoice #{invoice_data.get('invoice_number')}")
    print(f"\nInvoice Details:")
    print(f"Amount: ${invoice_data.get('total', 0):.2f}")
    print(f"Period: {invoice_data.get('period')}")
    print(f"\n[MOCK] Invoice email sent successfully!\n")
    return True
