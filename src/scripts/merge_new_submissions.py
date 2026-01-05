import json 
from tqdm import tqdm 

def write_json(path, data):
    with open(path, 'w') as fout:
        json.dump(data, fout)

def read_json(path):
    with open(path, 'r') as fin:
        data = json.load(fin)
    return data 

if __name__ == "__main__":

    researchers_new = read_json("./assets/researchers_new.json")
    researchers_update = read_json("./assets/researchers_update.json")

    researchers = read_json("./assets/researchers_en.json")

    for researcher_to_update in tqdm(researchers_update):
        for i, researcher in enumerate(researchers):
            if researcher["name"] == researcher_to_update["name"]:
                for key in researcher_to_update:
                    if str(researcher_to_update[key]).strip() not in ["", "NaN", "nan", None] and key not in ["hindex", "citedby"]:
                        if key == "photo" and researcher_to_update[key] == "./assets/images/default.jpg":
                            continue

                        researchers[i][key] = researcher_to_update[key]

                print(f"Updated {researcher['name']}")
                break

    researchers += researchers_new
    write_json("./assets/researchers_en.json", researchers)