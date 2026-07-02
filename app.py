import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Atom feed namespace
ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        # Create request with header to prevent user-agent blocking
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        
        feed_title_elem = root.find('atom:title', ATOM_NS)
        feed_title = feed_title_elem.text if feed_title_elem is not None else "BigQuery Release Notes"
        
        entries = []
        for entry in root.findall('atom:entry', ATOM_NS):
            title_elem = entry.find('atom:title', ATOM_NS)
            id_elem = entry.find('atom:id', ATOM_NS)
            updated_elem = entry.find('atom:updated', ATOM_NS)
            link_elem = entry.find('atom:link', ATOM_NS)
            content_elem = entry.find('atom:content', ATOM_NS)
            
            title = title_elem.text if title_elem is not None else ""
            entry_id = id_elem.text if id_elem is not None else ""
            updated = updated_elem.text if updated_elem is not None else ""
            link = link_elem.attrib.get('href') if link_elem is not None else ""
            content = content_elem.text if content_elem is not None else ""
            
            entries.append({
                'id': entry_id,
                'title': title,
                'updated': updated,
                'link': link,
                'content': content
            })
            
        return jsonify({
            'status': 'success',
            'feed_title': feed_title,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid default macOS AirPlay conflict on port 5000
    app.run(debug=True, host='0.0.0.0', port=5001)
