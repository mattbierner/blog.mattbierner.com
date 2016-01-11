import os
import re
import urllib
from distutils.dir_util import mkpath

IMAGE_RE = re.compile(r"\!\[([^\]]*)\]\(([^\{][^\)]+)\)")
IMAGE_RE2 = re.compile(r"\!\[([^\]]*)\]\(([^\)]+)\)")

SITE = 'http://blog.mattbierner.com'

def download_image(postname, path, output_dir):
    output_file = path.rsplit('/', 1)[-1]    
    output_path = os.path.join(output_dir, output_file)
    urllib.urlretrieve(path, output_path)

def replace_image_tags_with_includes(match):
    image_desc = match.group(1)
    image_path = match.group(2)
    return '{{% include image.html file="{1}" description="{0}" %}}'.format(image_desc, image_path)


def process_post(path, postname, post_content):
    output_dir = os.path.join('assets', postname)
    
    didRun = True
    if False:
        for image in re.finditer(IMAGE_RE, post_content):
            image_path = image.group(2)
    
            if not didRun:
                didRun = True
                mkpath(output_dir)

            if image_path[0] == '/':
                image_path = SITE + image_path

            download_image(filename, image_path, output_dir)
    
    if not didRun:
        return
    
    # Add `asset_path`
    if False:
        post_content = re.sub(r'\n(\-{3,})\n',
            r"\nasset_path: /{0}\n\1".format(output_dir),
            post_content,
            count=1,
            flags=re.M)
        
        
    post_content = re.sub(IMAGE_RE2, replace_image_tags_with_includes, post_content)
    
    with open(path, 'w') as f:
        f.write(post_content)
    
     
def process_post_file(filename, path):
    with open(path, 'r') as f:
        post_content = f.read()
    process_post(path, os.path.splitext(filename)[0], post_content)
        
for filename in os.listdir('_posts'):
     process_post_file(filename, os.path.join('_posts', filename))

    