---
layout: post
title: Of Interneting Trees with Python and Pi
series: blotre
date: '2015-07-23'
---
[Blot're.py][blotre-py] is a thin [Blot're][blotre] client for Python. This library has similar capabilities to [Blot're.js][blotre] and makes it easy to connect all sorts of good stuff to Blot're. Good stuff like your household plants. 

This post provides a quick introduction to Blot're.py by example. We'll hook a plant up to Blot're using a Raspberry Pi and a simple moisture sensor. You can find the complete [example source code here][src].

{% include image.html file="Chrome_Painter.jpg" description="So shiny, so chrome!" %}


# Hardware 
This post is more focused on the software side of things, but let me quickly overview the hardware I used for a simple soil moisture sensor. I'm not a hardware expert by any means, but even I was able to cobble together a working sensor just fine using a few tutorials.  

## Components
The basic component list comes [from this tutorial][hardware-tut], with a few substations and subtractions.

* Raspberry Pi 2.
* Pi Cobbler+.
* Breadboard.
* MCP3008 Analog to Digital Converter
* [Octopus Soil Moisture Sensor](http://www.amazon.com/Phantom-YoYo-Octopus-Moisture-Compatible/dp/B00ALUTN1G).
* Lots o' wire.

## Wiring
The Tuts+ moisture sensor tutorial was written for a Raspberry Pi Model B, so to wire up the analog to digital converter, I switched over to [an Adafruit tutorial][ada-tut]. The only important part is the connection from the Pi to the MCP3008, just ignore all the switches and sensors and whatnot.

{% include image.html file="raspberry_pi_pi_volume_knob_bb.png" %}

I wried up the moisture sensor to pin 0 on the MCP3008. The Adafruit tutorial also had some helpful Python code for reading integer values from the MCP3008 that I'll reference, but won't cover in any detail. The [example source][src] includes all that if you're interested.

{% include image.html file="wire-ratking.png" description="I must admit that my wiring was actually closer to this." %}

# Blot're.py
Back to the safety of software. 

## Installation
We'll need to install a few Python libraries before starting.

`rpi.gpio` allows us to read the sensor data.

```
$ sudo easy_install rpi.gpio
``` 

And Blot're.py of course, along with [Spectra][], a library for sampling colors. Both have pip packages:

```
$ pip install blotre spectra 
```

## Basic Queries 
The most basic use of Blot're.py is to query Blot're. This can be performed without authorization of any kind.

```python
import blotre

client = blotre.Blotre({})
```

Blot're.py has thin wrappers for all the common Blot're stream [REST operations][blotre-retst]. All operations return the exact same JSON data that the REST endpoints do, but parsed to Python dicts and lists.

```python
client.get_streams()
>>> [{u'status': {u'color': u'#362f55', u'poster': u'554666c3e4b0fa7f3e694afe', u'created': 1437632689172}, u'updated': 1437632689172, u'name': u'Eyes Wide Shut', u'created': 1436757651967, u'uri': u'matt/vidre/eyes+wide+shut', u'owner': u'554666c3e4b0fa7f3e694afe', u'id': u'55a32e93e4b0a1c13daf2e93'}, {u'status': {u'color': u'#dc4343', u'poster': u'554666c3e4b0fa7f3e694afe', u'created': 1437632688970}, u'updated': 1437632688970, u'name': u'Moby Dick', u'created': ...]
```

Operations take an optional set of parameters as well, which are treated as the query parameters of the REST request.

```python
client.get_streams({ 'query': 'moby' })
>>> [{u'status': {u'color': u'#41d4d4', u'poster': u'554666c3e4b0fa7f3e694afe', u'created': 1437632991057}, u'updated': 1437632991057, u'name': u'Moby Dick', u'created': 1433486657156, u'uri': u'matt/moby+dick', u'owner': u'554666c3e4b0fa7f3e694afe', u'id': u'55714541e4b0bdccb3e69644'}]
```

If a request fails, it raises a `blotre.RestError`. This object has the status code of the response, along with the `error` and `error_description` fields returned by Blot're.

## Authorization and Authorization Code Flow
Authorization is required for create, update, and delete operations. If you already have credentials, you can manually provides them when you create a new client instance.

```python
client = blotre.Blotre({}, creds = {
    'access_token' = "token value",
    'refresh_token' = "optional, refresh token value"
})
```

But if your app needs to obtain credentials, you have two options: the OAuth2 authorization code flow or using a [Blot're disposable clients][blotre-disposable]. We'll use a disposable client, but let's take a quick look at the authorization code flow first.

The empty `{}` we've been passing to the `Blotre` constructor is the client metadata. [Register a client app on Blot're][blotre-register] and then use this provided values to create a new instance:

```python
client = blotre.Blotre({
    'client_id': "55614f0630042c617481d7c3",
    'client_secret': "YTY1Njg2MDctZTdjYy00ODlhLWFkNmYtNjkzYjI3N2M0MDRl",
    'redirect_uri': "http://localhost:50000",
})
```

This app is not yet authorized, so we must get the user to visit the authorization url and obtain an authorization code.

```python
print client.get_authorization_url()

>>> https://blot.re/v0/oauth2/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A50000&response_type=code&client_id=55614f0630042c617481d7c3
```

Once you obtain the code, call `redeem_authorization_code` to get credentials. Any of the token endpoint requests may raise an `blotre.TokenEndpointError` if the request fails.

```python
try:
    # Exchange the code for creds and update the current client
    client.redeem_authorization_code(returned_code)
    # Client is now authorized
except blotre.TokenEndpointError as e:
    # Something went wrong.
    print e
```

But if the request succeeded, you can now make authorized requests on behalf of the authorizing user.

```python
# Create a new child stream for the authorized user.
name = '$T O A S T$'
client.create_stream({
    'name': name,
    'uri': client.join_uri(
        client.get_stream(client.creds['user']['rootStream'])['uri'],
        name)
})
```

## Disposable Client
[Disposable client apps][blotre-disposable] are good for prototyping and hacking together simple applications, like our soil moisture sensor. Blot're has two APIs for creating disposable client apps: one that is just a thin wrapper around the Blot're disposable API and one that provides a framework for persisting creds and prompting the user to redeem the onetime code. We'll use the latter.

To create a new disposable app, call `create_disposable_app` and pass in the required client metadata. 

```python
client = blotre.create_disposable_app({
    'name': "FaceToast",
    'blurb': "Your face on toast!"
})
```
`create_disposable_app` checks for persisted client data and makes sure these credentials are valid. If the creds are valid, no further steps are required and `client` can make authorized requests.

If no persisted creds are available or the client data has expired, a new disposable app is registered with Blot're. The user is then prompted to redeem the code and press enter once they have completed this. Once they do this, the client exchanges its secret for an access token and becomes authorized. In either case, we always end up with an authorized client app after `create_disposable_app` returns. 

# Plant're
Now let's use Blot're.py to connect some plants to the internet. The actual client app is pretty simple.

## Python App
First we have to set up GPIO:

```python
import RPi.GPIO as GPIO

SPICLK = 18
SPIMISO = 23
SPIMOSI = 24
SPICS = 25

GPIO.setmode(GPIO.BCM)
GPIO.setup(SPIMOSI, GPIO.OUT)
GPIO.setup(SPIMISO, GPIO.IN)
GPIO.setup(SPICLK, GPIO.OUT)
GPIO.setup(SPICS, GPIO.OUT)
```

We'll also use a few other constants. We'll use Spectra to sample the colors and I've included a sample range from my testing. Feel free to adjust any of these.

```python
import spectra

TARGET_STREAM_NAME = "Mr Tree"

# Range of sensor reading, from just watered to dry soil
MOISTURE_SENSOR_MAX = 825
MOISTURE_SENSOR_MIN = 400

MOISTURE_SCALE = spectra.scale(["#654d00", "green"])
    .domain([MOISTURE_SENSOR_MIN, MOISTURE_SENSOR_MAX])

# How often should the sensor be checked? (in seconds)
INTERVAL = 60 * 5
```

`update_plant_status` is the function that actually uploads the status of the plant. `create_stream` will automatically create a new stream if none exists or update the color of the existing stream.

```python
def update_plant_status(client, rootStream, status):
    return client.create_stream({
        'name': TARGET_STREAM_NAME,
        'uri': client.join_uri(rootStream['uri'], TARGET_STREAM_NAME),
        'status': {
            'color': status
        }
    })
```

Creating the client itself is very easy. The optional `file` parameter ensures that we always persist the client credentials to the same location even if the script is run from multiple places.

```python
client = blotre.create_disposable_app({
    'name': "Plant're",
    'blurb': "Blot're you a plant.",
    'file': os.path.join(
        os.path.dirname(os.path.realpath(__file__)),
        'plantre.clientdata.json')
})

def get_root_stream(client):
    return client.get_stream(client.creds['user']['rootStream'])

rootStream = get_root_stream(client)
```

Finally, we start reading the sensor value every five minutes and uploading the data. `readadc` comes from the [Adafruit tutorial][ada-tut].

```python
def clamp(minVal, maxVal, val):
    return min(maxVal, max(minVal, val))
    
while True:
    sample = readadc(0, SPICLK, SPIMOSI, SPIMISO, SPICS)
    print sample
    update_plant_status(client, rootStream,
        MOISTURE_SCALE(clamp(MOISTURE_SENSOR_MIN, MOISTURE_SENSOR_MAX, sample)).hexcode)
    time.sleep(INTERVAL)
```

On the first run, you'll be prompted to redeem the code. After that though, if everything goes right, this script should continue to run forever, with Blot're.py silently exchanging the refresh token for new credentials behind the scenes.

## Starting on Boot
If you are interested in using Blot're.py for sensors, it's helpful to running your scripts as daemons and starting them on boot. I've included a sample init.d script in [the source][src] based on [this post](http://blog.scphillips.com/posts/2013/07/getting-a-python-script-to-run-in-the-background-as-a-service-on-boot/).

```bash
!/bin/sh
# Based on: http://blog.scphillips.com/posts/2013/07/getting-a-python-script-to-run-in-the-background-as-a-service-on-boot/

# kFreeBSD do not accept scripts as interpreters, using #!/bin/sh and sourcing.
if [ true != "$INIT_D_SCRIPT_SOURCED" ] ; then
    set "$0" "$@"; INIT_D_SCRIPT_SOURCED=true . /lib/init/init-d-script
fi

## BEGIN INIT INFO
# Provides:          plantre
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Blot're soil moisture sensor.
## END INIT INFO

# Update to point to where script `main.py` lives.
DIR=/home/blotre/plantre
DAEMON=$DIR/main.py
DAEMON_NAME=plantre

# Must run as root for GIPO.
DAEMON_USER=root

PIDFILE=/var/run/$DAEMON_NAME.pid

do_start () {
    log_daemon_msg "Starting system $DAEMON_NAME daemon"
    start-stop-daemon --start --background --pidfile $PIDFILE --make-pidfile --user $DAEMON_USER --chuid $DAEMON_USER --startas $DAEMON -- $DAEMON_OPTS
    log_end_msg $?
}

do_stop () {
    log_daemon_msg "Stopping system $DAEMON_NAME daemon"
    start-stop-daemon --stop --pidfile $PIDFILE --retry 10
    log_end_msg $?
}

case "$1" in
    start|stop)
        do_${1}
        ;;
    restart|reload|force-reload)
        do_stop
        do_start
        ;;
    status)
        status_of_proc "$DAEMON_NAME" "$DAEMON" && exit 0 || exit $?
        ;;
    *)
        echo "Usage: /etc/init.d/$DAEMON_NAME {start|stop|restart|status}"
        exit 1
        ;;
esac
exit 0
```

To use this script be sure to:

* Update `DIR` to point to where your copy of `main.py` lives.
* Copy it into `/etc/init`
* Make sure both all scripts are executable.
* Run `sudo update-rc.d plantre.init.d.sh defaults` to register script to be run at init.

Start or stop the script by running:

```bash
$ sudo /etc/init.d/plantre.init.d.sh start
```

# Conclusion
Here's the [stream from my tree](https://blot.re/s/matt/mr+tree) using this script.

{% include image.html file="_DSC7976.jpg" description="Featuring production ready tupperware enclosure." %}

Be sure to checkout the rest of the [example source][src] and please report any bug you find in [Blot're.py][blotre-py].

[blotre]: https://blot.re
[blotre-py]: https://github.com/mattbierner/blotre-py
[blotre-js]: https://github.com/mattbierner/blotre-js
[blotre-register]: https://github.com/mattbierner/blotre/wiki/registering-a-client
[blotre-rest]: https://github.com/mattbierner/blotre/wiki/REST
[blotre-disposable]: https://github.com/mattbierner/blotre/wiki/single-use-clients

[src]: https://github.com/mattbierner/blotre-py-moisture-sensor-example

[spectra]: https://github.com/jsvine/spectra

[hardware-tut]: http://computers.tutsplus.com/tutorials/build-a-raspberry-pi-moisture-sensor-to-monitor-your-plants--mac-52875
[ada-tut]: https://learn.adafruit.com/reading-a-analog-in-and-controlling-audio-volume-with-the-raspberry-pi/connecting-the-cobbler-to-a-mcp3008