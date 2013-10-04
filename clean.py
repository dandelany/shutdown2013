from __future__ import print_function
from pprint import pprint
import csv, json

def make_totals(agencies):
	for agency_name in agencies:
		agency = agencies[agency_name]

		if 'total' not in agency:
			#print("NO TOTAL!", agency_name)
			total = {'staff': 0, 'furloughed': 0, 'exempt': 0}

			for sub_agency_name in agency['sub_agencies']:
				sub_agency = agency['sub_agencies'][sub_agency_name]
				total['staff'] += sub_agency['staff']
				total['furloughed'] += sub_agency['furloughed']
				total['exempt'] += sub_agency['exempt']

			#pprint(total)
			agency['total'] = total

	return agencies

def jsonify_agencies(agencies):
	agencies_json = {'name': 'agencies', 'children': []}

	for agency_name in agencies:
		agency = agencies[agency_name]
		agency_json = {'name': agency_name, 'children': []}

		for total_type in agency['total']:
			if total_type == 'staff': continue
			type_total = {'name': agency_name + ' ' + total_type, 'size': agency['total'][total_type]}
			agency_json['children'].append(type_total)

		agencies_json['children'].append(agency_json)

	return json.dumps(agencies_json)

def main():
	with open('furloughs.csv', 'rb') as csv_file:
		data_reader = csv.reader(csv_file)
		data_reader = data_reader
		furloughed_total = 0
		#agencies = { 'name': 'agencies', 'children': [] }
		agencies = {}

		for row in data_reader:
			#print(' | '.join(row))
			try:
				agency_name = row[0]
				sub_agency = row[1]
				staff = int(row[2])
				exempt = int(row[8])
				furloughed = staff - exempt
				furloughed_total += furloughed

				is_total = (sub_agency == '' or sub_agency == 'TOTAL')

				if agency_name not in agencies:
					agencies[agency_name] = {}
					agencies[agency_name]['name'] = agency_name
					agencies[agency_name]['sub_agencies'] = {}

				staff_data = {'staff': staff, 'furloughed': furloughed, 'exempt': exempt}
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
	agencies_json = jsonify_agencies(agencies)

	agencies_file = open('agencies.json', 'w')
	agencies_file.write(agencies_json + '\n')
	agencies_file.close()


if __name__ == '__main__':
    main()
