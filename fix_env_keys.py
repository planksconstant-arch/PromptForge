import os

env_path = '.env'
new_lines = []
key_val = None

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        lines = f.readlines()
        
    for line in lines:
        if line.startswith('FALLBACK_OPENAI_KEY='):
            key_val = line.strip().split('=', 1)[1]
        new_lines.append(line)
        
    if key_val:
        # Check if OPENROUTER_API_KEY already exists
        has_or = any(l.startswith('OPENROUTER_API_KEY=') for l in lines)
        if not has_or:
            new_lines.append(f"\nOPENROUTER_API_KEY={key_val}\n")
            print(f"Added OPENROUTER_API_KEY to {env_path}")
            
            with open(env_path, 'w') as f:
                f.writelines(new_lines)
        else:
            print("OPENROUTER_API_KEY already exists in .env")
    else:
        print("FALLBACK_OPENAI_KEY not found in .env")
else:
    print(".env not found")
