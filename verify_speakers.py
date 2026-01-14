import json
import re

def audit_speakers():
    file_path = r'c:\Users\pujar\Desktop\gitalens\gitaData.ts'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the GITA_VERSES array content
    # Look for export const GITA_VERSES: GitaVerse[] = [ ... ];
    match = re.search(r'export const GITA_VERSES: GitaVerse\[\] = (\[.*\]);', content, re.DOTALL)
    if not match:
        print("Could not find GITA_VERSES array in gitaData.ts")
        return

    verses_json = match.group(1)
    
    # Try to parse it as JSON by cleaning up some TS-isms if necessary
    # Note: The file seems to use standard JSON structure inside the array
    try:
        verses = json.loads(verses_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing GITA_VERSES as JSON: {e}")
        # If simple JSON parsing fails, we might need a more robust parser or manual iteration
        # Let's try to fix common JSON issues like trailing commas if they exist
        try:
            cleaned_json = re.sub(r',\s*\]', ']', verses_json)
            cleaned_json = re.sub(r',\s*\}', '}', cleaned_json)
            verses = json.loads(cleaned_json)
        except Exception as e2:
            print(f"Second attempt failed: {e2}")
            return

    active_speaker = "Dhritarashtra" # Ch 1 starts with him
    discrepancies = []

    for v in verses:
        text = v.get('text', '')
        old_speaker = v.get('speaker', '')
        
        # Determine if a new speaker is identified
        new_speaker = None
        if "Dhritarashtra said:" in text:
            new_speaker = "Dhritarashtra"
        elif "Sanjaya said:" in text:
            new_speaker = "Sanjaya"
        elif "Arjuna said:" in text:
            new_speaker = "Arjuna"
        elif "The Blessed Lord said:" in text:
            new_speaker = "Krishna"
        elif "Sri Bhagavan uvaca" in v.get('sanskrit', ''): # Some might have it in sanskrit block
            new_speaker = "Krishna"
        
        # Special case for 1.25: "he said, O Partha..." where he is Krishna
        if v['id'] == "1-25":
            new_speaker = "Krishna"
            
        if new_speaker:
            active_speaker = new_speaker
            
        if old_speaker != active_speaker:
            discrepancies.append({
                "id": v['id'],
                "text_preview": text[:100],
                "old_speaker": old_speaker,
                "new_speaker": active_speaker
            })

    print(f"Found {len(discrepancies)} discrepancies.")
    for d in discrepancies:
        print(f"Verse {d['id']}: '{d['old_speaker']}' -> '{d['new_speaker']}'")
        print(f"  Snippet: {d['text_preview']}...")

if __name__ == "__main__":
    audit_speakers()
