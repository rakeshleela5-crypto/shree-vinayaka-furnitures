import os
import json
import subprocess
from youtube_transcript_api import YouTubeTranscriptApi

videos = [
    ('01', '1WGtHRv2HC8', 'Stock Entry Stock adjustment Option'),
    ('02', 'mNejWvdEjvU', 'Product Expiry Reports and Management'),
    ('03', 'TtK1y8E1C8g', 'Sale Return and Purchase Return Records'),
    ('04', 'OHbL_WliFmg', 'Complete Inventory Management'),
    ('05', 'Mqz0TQLeN6U', 'Expenses Reports'),
    ('06', 'WCFI5q5UEUs', 'Purchase Records'),
    ('07', 'YfZZPbbY1bw', 'Customer Supplier Details Outstanding Analysis'),
    ('08', 'dOFRhwGVPw8', 'Google Drive Backup Option'),
    ('09', 'wTF-m6bJfQs', 'Logo change Reporting App connection'),
    ('10', 'vXHCNi2e4rQ', 'Quantity Based Auto Discount Option'),
    ('11', '-0hS3D9pXBc', 'Billing Software Login Panel Features'),
    ('12', 'rEGJb7vh-yo', 'Last Video for Sale Panel Video 10'),
    ('13', '_CvPherccNE', 'Loyalty Point Option and Sale Return Adjustment'),
    ('14', 'lrmvdOxu12Y', 'Auto CGST SGST IGST option Product Search'),
    ('15', 'bozPAsjZ5Cg', 'Sale Panel Tutorial 07'),
    ('16', 'L3_Qb-_eaGU', 'Sale Panel Features No 6'),
    ('17', '-USNz2kQAMA', 'Sale Panel Features No 5'),
    ('18', 'yHGQpw9QWeQ', 'Sale Panel Tutorial 04'),
    ('19', 'O6xo7WwVz-s', 'Sale Panel Features Tutorial 3'),
    ('20', 'LE9rXbTqKWM', 'Sale Panel Features Tutorial 2'),
    ('21', '1h9MjrG2jTg', 'Sale Panel Features Part 1'),
    ('22', 'kCvctZ7xxqs', 'How to add products Part 3'),
    ('23', 'ST51fTynS3Y', 'How to add product Part 2'),
    ('24', 'UODn7UtJ97U', 'Product adding Features Part 1')
]

out_dir = 'downloads/playlist_retail_daddy'
os.makedirs(out_dir, exist_ok=True)
trans_dir = os.path.join(out_dir, 'transcripts')
os.makedirs(trans_dir, exist_ok=True)
txt_dir = os.path.join(out_dir, 'readable_text')
os.makedirs(txt_dir, exist_ok=True)

ytt = YouTubeTranscriptApi()
catalog = []

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print(f"Starting transcript fetch for {len(videos)} videos...")

for idx, vid, title in videos:
    print(f"[{idx}/24] Fetching transcripts for: {title} ({vid})...")
    item_info = {'index': idx, 'id': vid, 'title': title, 'languages': []}
    try:
        t_list = ytt.list(vid)
        for t in t_list:
            lang = t.language_code
            item_info['languages'].append(lang)
            raw = t.fetch().to_raw_data()
            with open(os.path.join(trans_dir, f"{idx}_{vid}_{lang}.json"), 'w', encoding='utf-8') as f:
                json.dump(raw, f, ensure_ascii=False, indent=2)
            
            # Also write readable text with timestamps
            with open(os.path.join(txt_dir, f"{idx}_{title}_{lang}.txt"), 'w', encoding='utf-8') as f:
                for line in raw:
                    start = line.get('start', 0)
                    text = line.get('text', '')
                    f.write(f"[{start:6.1f}s] {text}\n")

        print(f"  Saved languages: {item_info['languages']}")
    except Exception as e:
        print(f"  Could not fetch transcript for {vid}: {e}")
    
    catalog.append(item_info)

with open(os.path.join(out_dir, 'catalog.json'), 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print("\nDone fetching all transcripts!")
