"""
Email notification service for Lost & Found system.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_claim_notification(student_email, inquiry_id, inquiry_description):
    """
    Send email notification when item is ready for claim.
    
    Args:
        student_email: Student's email address
        inquiry_id: Unique inquiry ID
        inquiry_description: Description of the lost item
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Email configuration (from environment variables)
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        
        # If email not configured, log and return False
        if not sender_email or not sender_password:
            print("[EMAIL] Email not configured. Set SMTP_HOST, SENDER_EMAIL, SENDER_PASSWORD in .env")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Lost & Found: Your Item May Have Been Found!'
        msg['From'] = sender_email
        msg['To'] = student_email
        
        # Email body
        text = f"""
Hello,

Good news! We may have found your lost item.

Inquiry ID: {inquiry_id}
Item Description: {inquiry_description}

Your inquiry status has been updated to "WAITING_FOR_CLAIM".

Please visit the Lost & Found office to verify and claim your item.

Best regards,
Lost & Found Team
"""
        
        html = f"""
<html>
  <body>
    <h2>Good news! We may have found your lost item.</h2>
    <p><strong>Inquiry ID:</strong> {inquiry_id}</p>
    <p><strong>Item Description:</strong> {inquiry_description}</p>
    <p>Your inquiry status has been updated to <strong>WAITING_FOR_CLAIM</strong>.</p>
    <p>Please visit the Lost & Found office to verify and claim your item.</p>
    <br>
    <p>Best regards,<br>Lost & Found Team</p>
  </body>
</html>
"""
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, student_email, msg.as_string())
        
        print(f"[EMAIL] Notification sent to {student_email} for inquiry {inquiry_id}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] Failed to send notification: {str(e)}")
        return False
