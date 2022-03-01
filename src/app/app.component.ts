import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import ZoomVideo from '@zoom/videosdk';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  zoomVideo = ZoomVideo.createClient()
  sessionName = Math.random().toString(36).slice(2)
  sessionPasscode = Math.random().toString(36).slice(8)
  userName;
  zoomVideoStream;
  session;
  playbackUrl;
  arn;
  error;
  loading: boolean = false;
  live: boolean = false;
  audio: boolean = false;
  video: boolean = false;

  constructor(public httpClient: HttpClient, @Inject(DOCUMENT) document) {
    this.zoomVideo.init('en-US', 'CDN');
  }

  startLiveStream() {
    this.loading = true;

    // get Zoom Video SDK session

    this.httpClient.post('https://videosdk-sample-signature.herokuapp.com', {
	    sessionName: this.sessionName,
	    sessionPasscode: this.sessionPasscode
    }).toPromise().then((data: any) => {

      this.zoomVideo.join(this.sessionName, data.signature, this.userName, this.sessionPasscode).then((data) => {

        this.zoomVideoStream = this.zoomVideo.getMediaStream()

        this.session = this.zoomVideo.getSessionInfo()
        console.log(this.session)

        // start Zoom Video SDK first and get sessionId

        this.httpClient.post('https://owb9o3o0ll.execute-api.us-east-1.amazonaws.com/prod/start', {
          sessionId: this.session.sessionId,
          topic: this.session.topic
        }).toPromise().then((response: any) => {
          console.log(response)
          this.playbackUrl = JSON.parse(response.body).playbackUrl;
          this.arn = JSON.parse(response.body).arn;

          console.log(this.playbackUrl)
          this.live = true;
          this.loading = false;
        }).catch((error) => {
          console.log(error)
          this.error = JSON.stringify(error)
          this.loading = false;
        })

      }).catch((error) => {
        console.log(error)
        this.error = JSON.stringify(error)
        this.loading = false;
      })
    }).catch((error) => {
      console.log(error)
      this.error = JSON.stringify(error)
      this.loading = false;
    })
  }

  endLiveStream() {
    this.loading = true;
    this.live = false;
    // stop livestream
    this.httpClient.post('https://owb9o3o0ll.execute-api.us-east-1.amazonaws.com/prod/end', {
      sessionId: this.session.sessionId,
      arn: this.arn
    }).toPromise().then((response: any) => {
      console.log(response)
      // stop Zoom video sdk session
      this.zoomVideo.leave(true).then((data) => {
        console.log(data)
        this.loading = false;
        this.audio = false;
        this.video = false;
      }).catch((error) => {
        console.log(error)
        this.error = JSON.stringify(error)
        this.loading = false;
      })
    }).catch((error) => {
      console.log(error)
      this.error = JSON.stringify(error)
      this.loading = false;
    })
  }

  startAudoVideo() {
    this.loading = true;
    const videoCanvas = document.querySelector('#videoCanvas')

    this.zoomVideoStream.startVideo().then(() => {
      this.zoomVideoStream.renderVideo(videoCanvas, this.session.userId, 1920, 1080, 0, 0, 3)
      this.video = true;
      this.loading = false;
    }).catch((error) => {
      console.log(error)
      this.video = false;
      this.loading = false;
    })

    this.zoomVideoStream.startAudio().then(() => {

    }).catch((error) => {
      console.log(error)
      this.error = JSON.stringify(error)
      this.loading = false;
    })
  }
}
