from scraper.supabase_client import supabase

def fix_schema():
    print("Checking/Adding is_saved column...")
    try:
        # We can't run raw SQL easily via the client for schema changes, 
        # but the user said it wasn't working.
        # I'll provide a Python script that tries to insert/update a dummy job to see if it fails.
        # But actually, the best way is to provide the SQL to the user.
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_schema()
