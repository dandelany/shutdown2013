from __future__ import print_function
from pprint import pprint
import csv, json

#abbreviations = {
#    'Department of Agriculture': ['Dept. of Agriculture', 'DOA'],
#    'Department of Veterans Affairs': ['Dept. of Veterans Affairs', "VA"],
#    'Department of Defense': ["Dept. of Defense", "DOD"],
#    'Social Security Administration': ["Soc. Security Admin.", "SSA"],
#    'Department of Homeland Security': ["Dept. Homeland Sec.", "DHS"],
#    'National Aeronautics and Space Administration': ["NASA"],
#    'Department of Interior': ["Dept. of Interior", "DOI"],
#    'Department of Justice': ["Dept. of Justice", "DOJ"],
#    'Department of Health and Human Services': ['Dept. Health & Human Services', 'HHS'],
#    'Department of Transportation': ["Dept. of Transportation", "DOT"],
#    'Department of Commerce': ["Dept. of Commerce", "DOC"],
#    'Department of Labor': ["Dept. of Labor", "DOL"],
#    'Environmental Protection Agency': ["EPA"],
#    'Department of Energy': ["Dept. of Energy", "DOE"],
#    'Department of Housing and Urban Development': ['Dept. Housing & Human Dev.', "HUD"]
#}

abbreviations = {
    'Department of Agriculture': ['Agriculture', 'DOA'],
    'Department of Veterans Affairs': ['Veterans Affairs', "VA"],
    'Department of Defense': ["Defense", "DOD"],
    'Social Security Administration': ["Social Security", "SSA"],
    'Department of Homeland Security': ["Homeland Security", "DHS"],
    'National Aeronautics and Space Administration': ["NASA"],
    'Department of Interior': ["Interior", "DOI"],
    'Department of Justice': ["Justice", "DOJ"],
    'Department of Health and Human Services': ['Health', 'HHS'],
    'Department of Transportation': ["Transportation", "DOT"],
    'Department of Commerce': ["Commerce", "DOC"],
    'Department of Labor': ["Labor", "DOL"],
    'Environmental Protection Agency': ["EPA"],
    'Department of Energy': ["Energy", "DOE"],
    'Department of Housing and Urban Development': ['Housing', "HUD"],
    'Securities and Exchange Commission': ['SEC'],
    'National Science Foundation': ["Science", "NSF"],
    'National Archives': ['Archives', "NA"],
    'Department of Treasury': ["Treasury", "DOT"],
    'Department of Education': ["Education", "Edu"]
}

def make_totals(agencies):
	for agency_name in agencies:
		agency = agencies[agency_name]

		if 'total' not in agency:
			#print("NO TOTAL!", agency_name)
			total = {'staff': 0, 'furloughed': 0, 'exempt_a': 0, 'exempt_b': 0, 'exempt_c': 0, 'exempt_d': 0}

			for sub_agency_name in agency['sub_agencies']:
				sub_agency = agency['sub_agencies'][sub_agency_name]
				total['staff'] += sub_agency['staff']
				total['furloughed'] += sub_agency['furloughed']
				total['exempt_a'] += sub_agency['exempt_a']
				total['exempt_b'] += sub_agency['exempt_b']
				total['exempt_c'] += sub_agency['exempt_c']
				total['exempt_d'] += sub_agency['exempt_d']

			#pprint(total)
			agency['total'] = total

	return agencies

def make_abbreviations(agencies):
    for agency_name in agencies:
    	if agency_name in abbreviations:
    	    agencies[agency_name]['abbreviations'] = abbreviations[agency_name]
    return agencies

def jsonify_agencies(agencies, furloughed_total):
	agencies_json = {'name': 'agencies', 'children': []}

	for agency_name in agencies:
		agency = agencies[agency_name]
		agency_json = {'name': agency_name, 'children': []}

		for total_type in agency['total']:
			if total_type == 'staff': continue
			type_total = {'name': total_type, 'size': agency['total'][total_type]}
			agency_json['children'].append(type_total)

		if 'abbreviations' in agency:
			agency_json['abbreviations'] = agency['abbreviations']

		agency_json['furloughed_total'] = agency['total']['furloughed']
		agency_json['exempt_total'] = agency['total']['exempt_a'] + agency['total']['exempt_b'] + agency['total']['exempt_c'] + agency['total']['exempt_d']
		agencies_json['children'].append(agency_json)

	agencies_json['furloughed_total'] = furloughed_total
	return json.dumps(agencies_json)

def main():
	with open('data/furloughs.csv', 'rb') as csv_file:
		data_reader = csv.reader(csv_file)
		data_reader = data_reader
		furloughed_total = 0
		#agencies = { 'name': 'agencies', 'children': [] }
		agencies = {}

		for row in data_reader:
			#print(' | '.join(row))
			try:
				agency_name = row[0].strip()
				sub_agency = row[1]
				staff = int(row[2])
				exempt = int(row[8])
				exempt_a = int(row[4] or 0)
				exempt_b = int(row[5] or 0)
				exempt_c = int(row[6] or 0)
				exempt_d = int(row[7] or 0)
				furloughed = staff - exempt
				furloughed_total += furloughed

				is_total = (sub_agency == '' or sub_agency == 'TOTAL')

				if agency_name not in agencies:
					agencies[agency_name] = {}
					agencies[agency_name]['name'] = agency_name
					agencies[agency_name]['sub_agencies'] = {}

				staff_data = {'staff': staff, 'furloughed': furloughed, 'exempt_a': exempt_a, 'exempt_b': exempt_b, 'exempt_c': exempt_c, 'exempt_d': exempt_d};
				if is_total:
					agencies[agency_name]['total'] = staff_data
				else:
					staff_data['name'] = sub_agency
					agencies[agency_name]['sub_agencies'][sub_agency] = staff_data

			except ValueError:
				continue
			#print(agency, sub_agency, staff, furloughed, exempt)

	print("total furloughed: ", furloughed_total)
	agencies = make_totals(agencies)
	agencies = make_abbreviations(agencies)
	#agencies['total_furloughed'] = furloughed_total
	agencies_json = jsonify_agencies(agencies, furloughed_total)
	#print(agencies_json)

	agencies_file = open('data/agencies.js', 'w')
	agencies_file.write('Shutdown2013.AGENCIES = ' + agencies_json + ';\n')
	agencies_file.close()


if __name__ == '__main__':
    main()
