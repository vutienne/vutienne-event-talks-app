from flask import Flask, jsonify, render_template, request
import urllib.request
import xml.etree.ElementTree as ET
import re
import html

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def strip_html(html_text):
    # Strip HTML tags
    clean = re.sub(r'<[^>]+>', '', html_text)
    # Unescape HTML entities
    clean = html.unescape(clean)
    # Normalize whitespaces
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def fetch_and_parse_feed():
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('atom:entry', ns)
    parsed_entries = []
    
    for entry in entries:
        title_elem = entry.find('atom:title', ns)
        updated_elem = entry.find('atom:updated', ns)
        id_elem = entry.find('atom:id', ns)
        link_elem = entry.find('atom:link', ns)
        content_elem = entry.find('atom:content', ns)
        
        title = title_elem.text if title_elem is not None else "No Date"
        updated = updated_elem.text if updated_elem is not None else ""
        entry_id = id_elem.text if id_elem is not None else ""
        
        # Link href extraction
        link_href = ""
        if link_elem is not None:
            link_href = link_elem.attrib.get('href', '')
        
        content_text = content_elem.text if content_elem is not None else ""
        
        # Parse individual release items within the content
        blocks = re.split(r'<h3>', content_text)
        items = []
        for block in blocks:
            if not block.strip():
                continue
            if '</h3>' in block:
                parts = block.split('</h3>', 1)
                item_type = parts[0].strip()
                item_html = parts[1].strip()
            else:
                item_type = "General"
                item_html = block.strip()
            
            items.append({
                "type": item_type,
                "html_content": item_html,
                "text_content": strip_html(item_html)
            })
            
        parsed_entries.append({
            "title": title,
            "updated": updated,
            "id": entry_id,
            "link": link_href,
            "items": items
        })
        
    return parsed_entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        entries = fetch_and_parse_feed()
        return jsonify({
            "success": True,
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
