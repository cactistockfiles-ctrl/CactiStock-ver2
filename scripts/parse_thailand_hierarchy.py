import re
from pathlib import Path

base = Path(__file__).resolve().parent.parent
files = {
    'province': base / 'province.ts',
    'district': base / 'district.ts',
    'subDistrict': base / 'subDistrict.ts',
    'zipcode': base / 'zipcode.ts',
}


def parse_ts_array(path):
    text = path.read_text(encoding='utf-8')
    arr_match = re.search(r'\[([\s\S]*)\]\s*$', text)
    if not arr_match:
        raise ValueError(f'no array found in {path}')
    arr_text = arr_match.group(1)
    items = []
    brace = 0
    start = 0
    for i, ch in enumerate(arr_text):
        if ch == '{':
            if brace == 0:
                start = i
            brace += 1
        elif ch == '}':
            brace -= 1
            if brace == 0:
                items.append(arr_text[start:i+1])
    def parse_obj(item):
        obj = {}
        for m in re.finditer(r"([a-zA-Z_]\w*)\s*:\s*('(?:[^'\\]|\\.)*'|\"(?:[^\\\"]|\\.)*\")", item):
            key = m.group(1)
            val = m.group(2)[1:-1]
            obj[key] = val
        return obj
    return [parse_obj(item) for item in items]

province = parse_ts_array(files['province'])
district = parse_ts_array(files['district'])
subdist = parse_ts_array(files['subDistrict'])
zipcode = parse_ts_array(files['zipcode'])
print('counts', len(province), len(district), len(subdist), len(zipcode))

province_map = {p['pid']: p['v'] for p in province}
district_map = {d['pid']: {'v': d['v'], 'ppid': d['ppid']} for d in district}
sub_map = {s['pid']: {'v': s['v'], 'dpid': s['dpid']} for s in subdist}
zip_map = {}
for z in zipcode:
    zip_map.setdefault(z['pid'], []).append(z['v'])

obj = {'Thailand': {'label': 'Thailand', 'children': {}}}
for pid, pname in province_map.items():
    obj['Thailand']['children'][pname] = {'label': pname, 'children': {}}
for did, ddata in district_map.items():
    pname = province_map[ddata['ppid']]
    obj['Thailand']['children'][pname]['children'][ddata['v']] = {'label': ddata['v'], 'children': {}}
for spid, sdata in sub_map.items():
    ddata = district_map[sdata['dpid']]
    pname = province_map[ddata['ppid']]
    obj['Thailand']['children'][pname]['children'][ddata['v']]['children'][sdata['v']] = {
        'label': sdata['v'],
        'zipcodes': zip_map.get(spid, []),
    }

prov_count = len(obj['Thailand']['children'])
dis_count = sum(len(p['children']) for p in obj['Thailand']['children'].values())
sub_count = sum(len(d['children']) for p in obj['Thailand']['children'].values() for d in p['children'].values())
zip_count = sum(len(s['zipcodes']) for p in obj['Thailand']['children'].values() for d in p['children'].values() for s in d['children'].values())
print('built', prov_count, dis_count, sub_count, zip_count)
print('sample provinces', list(obj['Thailand']['children'].keys())[:10])
print('sample district for Bangkok', list(obj['Thailand']['children']['กรุงเทพมหานคร']['children'].keys())[:10])
print('sample subdistrict for พระนคร', list(obj['Thailand']['children']['กรุงเทพมหานคร']['children']['พระนคร']['children'].keys())[:10])
