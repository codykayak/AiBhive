import os
import subprocess
import base64
import requests
import json

def run_cmd(cmd):
    return subprocess.check_output(cmd, shell=True).decode('utf-8').strip()

# We can't easily push a binary APK file via simple REST API without trees/blobs,
# so let's try to set up the git remote with a token if we can find one.
# Wait, we don't have a user token. Let's see if the platform `submit` tool works this time.
