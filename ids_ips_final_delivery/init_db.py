from logging_system.logger import IDSLogger
import os

# Get the absolute path to the project root
project_root = os.path.dirname(os.path.abspath(__file__))

# Construct the absolute path to the logs directory
log_directory_path = os.path.join(project_root, 'logs')

# Ensure the logs directory exists
os.makedirs(log_directory_path, exist_ok=True)

logger = IDSLogger({'log_directory': log_directory_path})
logger.initialize_database()
print(f"Database initialized in: {log_directory_path}")
