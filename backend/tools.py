from pydantic import BaseModel
from crewai.tools import BaseTool
from twilio.rest import Client
import os 
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_from = os.getenv("TWILIO_FROM")
ALERT_TO = os.getenv("ALERT_TO")    # system emergency number


class SMSToolInput(BaseModel):
    # Phone number will be ignored, but schema still required by CrewAI
    phone_number: str
    message: str


class SMSTool(BaseTool):
    name: str = "sms_tool"
    description: str = "Sends SMS alert to the preset emergency phone number"
    args_schema = SMSToolInput

    def _run(self, phone_number: str, message: str):
        try:
            # FORCE using system emergency number
            phone_number = ALERT_TO

            client = Client(account_sid, auth_token)
            sms = client.messages.create(
                body=message,
                from_=twilio_from,
                to=phone_number
            )
            return f"SMS sent successfully. SID: {sms.sid}"
        except Exception as e:
            return f"SMS failed: {str(e)}"
