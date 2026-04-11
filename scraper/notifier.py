import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def send_scraping_alert(total_new_jobs: int):
    """
    Sends an email alert with the scraping summary.
    """
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    recipient = os.environ.get("ALERT_RECIPIENT")

    if not all([smtp_server, smtp_port, smtp_user, smtp_password, recipient]):
        logger.warning("Email alert skipped: Missing SMTP configuration in .env")
        return

    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = recipient
        msg['Subject'] = f"🚀 Job Tracker Scraper Complete: {total_new_jobs} New Jobs"

        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #3b82f6;">Scraping Session Complete</h2>
                <p>Hello,</p>
                <p>The automated job scraper has finished its latest run.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px;">New Jobs Found: <strong>{total_new_jobs}</strong></p>
                </div>
                <p>You can view the new listings on your <a href="http://localhost:3000/jobs">Job Tracker Dashboard</a>.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">This is an automated message from your Job Tracker System.</p>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        # Connect and send
        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Scraping alert email sent to {recipient}")

    except Exception as e:
        logger.error(f"Failed to send email alert: {str(e)}")
