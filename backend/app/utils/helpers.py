"""
app/utils/helpers.py
Utility and helper functions used across different layers of the application.
Examples: date formatters, file readers, string manipulators, etc.
"""

def format_response_data(data):
    """
    Example helper function to standardize data formatting.
    """
    return {
        'payload': data,
        'metadata': {
            'version': '1.0'
        }
    }
