import re
import json 
import time
import datetime
from tqdm import tqdm 
from scholarly import scholarly
from populate import download_and_resize_image

def write_json(path, data):
    with open(path, 'w') as fout:
        json.dump(data, fout)

def read_json(path):
    with open(path, 'r') as fin:
        data = json.load(fin)
    return data 

if __name__ == "__main__":

    out_file = "./assets/researchers_en.json"
    # 57, 105, 106
    researchers = read_json("./assets/researchers_en.json")

    timestamp = time.time()
    # Convert the timestamp to a datetime object
    datetime_obj = datetime.datetime.fromtimestamp(timestamp)
    # Format the datetime object into a readable date format
    formatted_date = datetime_obj.strftime("%Y-%m-%d")

    for researcher in tqdm(researchers):
        scholar_link = researcher["scholar"]
        pattern = r'user=([\w-]+)'
        match = re.search(pattern, scholar_link)
        if match:
            scholar_id = match.group(1)
            try:
                author = scholarly.fill(scholarly.search_author_id(scholar_id))
                if author["hindex"] != researcher["hindex"]:
                    print(f"> Updating {researcher['name']} h-index: {researcher['hindex']} --> {author['hindex']}") 
                researcher["hindex"] = author['hindex']
                researcher["citedby"] = author["citedby"]
                researcher["lastupdate"] = formatted_date

                if researcher["affiliation"].strip() in ["", "NaN", "nan", None]:
                    researcher["affiliation"] = author["affiliation"]
                    print(f"> Updating affiliation for {researcher['name']} --> {researcher['affiliation']}")

                if researcher["photo"] in ["", "NaN", "nan", None, "./assets/images/default.jpg"]:
                    photo_url = author.get("url_picture", "")
                    if photo_url.strip() != "":
                        print(f"Downloading photo for {researcher['name']}")
                        photo_path = f"./assets/images/{researcher['name'].replace(' ', '-').lower()}.jpg"
                        researcher["photo"] = download_and_resize_image(photo_url, photo_path)
                        print(f"> Downloaded photo for {researcher['name']}")

                if researcher["website"].strip() in ["", "NaN", "nan", None]:
                    researcher["website"] = author.get("homepage", "")
                    if researcher["website"].strip() != "":
                        print(f"> Updating website for {researcher['name']} --> {researcher['website']}")


                if researcher["interests"] == []:
                    interests = author.get("interests", [])
                    researcher["interests"] = interests
                    print(f"> Updating interests for {researcher['name']} --> {researcher['interests']}")

                if "standardized_interests" not in researcher or researcher["standardized_interests"] == []:
                    researcher["standardized_interests"] = interests
                    print(f"> Updating standardized_interests for {researcher['name']} --> {researcher['standardized_interests']}")

            except Exception as e:
                print(f"[Error] {researcher['name']}: {e}")
                continue 
        else:
            if "lastupdate" not in researcher:
                researcher["lastupdate"] = ""
                researcher["citedby"] = 0
            print(f"{researcher['name']} not found!")
    
        write_json(out_file, researchers)
