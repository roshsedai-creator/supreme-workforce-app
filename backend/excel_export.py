"""Excel export service for payroll"""
from io import BytesIO
import xlsxwriter
from datetime import datetime
from typing import List, Dict

def create_payroll_excel(timesheets: List[Dict], start_date: str, end_date: str) -> bytes:
    """Create Excel file for payroll export"""
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet('Payroll')
    
    # Formats
    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#5A2E8A',
        'font_color': 'white',
        'align': 'center',
        'border': 1
    })
    
    currency_format = workbook.add_format({'num_format': '$#,##0.00'})
    date_format = workbook.add_format({'num_format': 'yyyy-mm-dd'})
    
    # Headers
    headers = ['Employee ID', 'Employee Name', 'Site', 'Date', 'Clock In', 'Clock Out', 
               'Total Hours', 'Break (min)', 'Pay Rate', 'Total Pay', 'Status', 'Notes']
    
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # Data
    row = 1
    total_hours = 0
    total_pay = 0
    
    for ts in timesheets:
        worksheet.write(row, 0, ts.get('employee_id', ''))
        worksheet.write(row, 1, ts.get('employee_name', ''))
        worksheet.write(row, 2, ts.get('site_name', ''))
        
        if ts.get('clock_in'):
            worksheet.write_datetime(row, 3, datetime.fromisoformat(ts['clock_in'].replace('Z', '+00:00')), date_format)
            worksheet.write(row, 4, ts['clock_in'][11:19])
        
        if ts.get('clock_out'):
            worksheet.write(row, 5, ts['clock_out'][11:19])
        
        hours = ts.get('total_hours', 0)
        pay = ts.get('total_pay', 0)
        
        worksheet.write(row, 6, hours)
        worksheet.write(row, 7, ts.get('break_minutes', 0))
        worksheet.write(row, 8, ts.get('pay_rate', 0), currency_format)
        worksheet.write(row, 9, pay, currency_format)
        worksheet.write(row, 10, ts.get('approval_status', ''))
        worksheet.write(row, 11, ts.get('supervisor_notes', ''))
        
        total_hours += hours
        total_pay += pay
        row += 1
    
    # Summary row
    row += 1
    summary_format = workbook.add_format({'bold': True, 'bg_color': '#F0F0F0'})
    worksheet.write(row, 5, 'TOTAL:', summary_format)
    worksheet.write(row, 6, total_hours, summary_format)
    worksheet.write(row, 9, total_pay, workbook.add_format({'bold': True, 'num_format': '$#,##0.00', 'bg_color': '#F0F0F0'}))
    
    # Adjust column widths
    worksheet.set_column('A:A', 15)
    worksheet.set_column('B:B', 20)
    worksheet.set_column('C:C', 20)
    worksheet.set_column('D:D', 12)
    worksheet.set_column('E:F', 10)
    worksheet.set_column('G:J', 12)
    worksheet.set_column('K:L', 15)
    
    workbook.close()
    output.seek(0)
    
    return output.getvalue()
