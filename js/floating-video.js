//Wrap in an IIFE to prevent global namespace polution
(function() {

    var iframeList, // Array of all iframes
        videoList,
        currentPlayer,
        closeButton;
    var inViewPortBol = true;
    var ytVideoElements = []; // Array of YT elements
    var ytPlayer = []; //Array of YT Player Objects
    var videoTags = [];
    var events = new Array("ended", "pause", "playing");

    document.addEventListener('DOMContentLoaded', initialize);

    function initialize() {

        /*Add Youtube Iframe API script to body*/
        addYouTubeAPI();

        /*Get all the iframe from the Page and finding out valid URL and ID. Then creating instance of players*/
        createYTPlayers();

        /*Get Video Tag List and Creating instances*/
        createVideoPlayers();

        //Setup Close Button Handler
        setupCloseButtonHandler();
    }

    /* This code loads the IFrame Player API code asynchronously. */
    function addYouTubeAPI() {
        var youTubeVideoTag = document.createElement('script');
        youTubeVideoTag.src = "//www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        document.body.appendChild(youTubeVideoTag, firstScriptTag);
    }

    /*Parse Youtube ID from from a url  */
    function parseYTid(url) {
        let ytid;
        let parsedUrl = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);

        //Parse Youtube Segment
        if (parsedUrl[2] !== undefined) {
            ytid = parsedUrl[2].split(/[^0-9a-z_\-]/i);
            ytid = ytid[0];
        };

        return ytid;
    }

    function createYTPlayers() {

        //List of iframe elements
        // iframeList = document.getElementsByTagName("iframe");

        iframeList = document.querySelectorAll(".videowrapper > iframe");

        console.log("iframeList: ", iframeList);
        for (i = 0; i < iframeList.length; i++) {

            if (new RegExp("\\b" + "enablejsapi" + "\\b").test(iframeList[i].src)) {

                //Check for YouTube API Services.
                var url = iframeList[i].src;
                var ytid = parseYTid(url); //returns youtube id

                //Set the id property of array of each iframe
                iframeList[i].id = "featured-video" + i;
                iframeList[i].setAttribute("ytid", ytid); // Set an attribute called ytid
                ytVideoElements[i] = document.getElementById(iframeList[i].id);
            }
        }
    }

    function createVideoPlayers() {

        //videoList = document.getElementsByTagName("video");

        videoList = document.querySelectorAll(".videowrapper video");
        // if (!videoList) {
        //     videoList = [];
        // }

        for (i = 0; i < videoList.length; i++) {
            videoList[i].id = "video-featured" + i;
            videoTags[i] = document.getElementById(videoList[i].id);

            for (var j in events) {
                videoTags[i].addEventListener(events[j], videoTagPlayerhandler, false);
            }
        }

    }

    function videoTagPlayerhandler(event) {

        for (i = 0; i < videoTags.length; i++) {

            if (event.target == videoTags[i]) {

                switch (event.type) {
                    case "playing":
                        currentPlayer = videoTags[i];
                        videoTags[i].classList.remove("is-paused");
                        videoTags[i].classList.add("is-playing");
                        break;
                    case "pause":
                        videoTags[i].classList.add("is-paused");
                        videoTags[i].classList.remove("is-playing");
                        videoTags[i].pause();
                        break;
                    case "ended":
                        videoTags[i].classList.remove("is-playing");
                        videoTags[i].classList.remove("is-paused");
                        break;
                    default:
                        videoTags[i].classList.remove("is-playing");
                        videoTags[i].classList.add("is-paused");
                        videoTags[i].pause();
                }
            }
        }

        pauseAndHideStickyVideos();

    };

    /*
     * When youtube iframes are ready, we create a player object for
     * each of the YT iFrames and set a handler
     */
    window.onYouTubeIframeAPIReady = function() {

        for (i = 0; i < ytVideoElements.length; i++) {
            ytPlayer[i] = new YT.Player(ytVideoElements[i].id, {
                events: {
                    "onStateChange": onYTPlayerStateChange
                }
            });
        }

    };

    function onYTPlayerStateChange(event) {

        /*Play Rules*/
        for (i = 0; i < ytPlayer.length; i++) {

            if (event.target.a == ytVideoElements[i]) {

                switch (ytPlayer[i].getPlayerState()) {
                    case 0: //Ended
                        ytVideoElements[i].classList.remove("is-playing");
                        ytVideoElements[i].classList.remove("is-paused");
                        break;
                    case 1: //Playing
                        currentPlayer = ytVideoElements[i];
                        ytVideoElements[i].classList.remove("is-paused");
                        ytVideoElements[i].classList.add("is-playing");
                        break;
                    case 2: //Pause
                        ytVideoElements[i].classList.add("is-paused");
                        ytVideoElements[i].classList.remove("is-playing");
                        // ytPlayer[i].pauseVideo();
                        break
                }

            }
        }

        pauseAndHideStickyVideos();

    }

    function pauseAndHideStickyVideos() {
        pauseStickyAndHideVideoTags();
        pauseAndHideStickyYTVideos();
    }

    function pauseAndHideStickyYTVideos() {
        // If Youtube is playing, pause video and
        for (i = 0; i < ytPlayer.length; i++) {

            if (ytVideoElements[i].classList.contains("is-sticky") && currentPlayer != ytVideoElements[i]) {
                ytPlayer[i].pauseVideo();

                //Close float video if current player is youtube player
                closeFloatVideo(ytVideoElements[i]);

            }
        }
    }

    function pauseStickyAndHideVideoTags() {

        for (i = 0; i < videoTags.length; i++) {

            if (videoTags[i].classList.contains("is-sticky") && currentPlayer != videoTags[i]) {
                videoTags[i].pause();
                closeFloatVideo(videoTags[i]);
            }
        }
    }

    function setupCloseButtonHandler() {

        closeButton = document.querySelector("a.close-button");
        closeButton.addEventListener("click", function(event) {
            event.preventDefault();

            closeFloatVideo(currentPlayer);

            for (i = 0; i < ytVideoElements.length; i++) {
                if (currentPlayer == ytVideoElements[i]) {
                    ytPlayer[i].pauseVideo();
                }
            }

            for (i = 0; i < videoTags.length; i++) {
                if (currentPlayer == videoTags[i]) {
                    videoTags[i].pause();
                }
            }

        });
    }

    window.addEventListener('scroll', function(event) {

        inViewPortBol = inViewPort();

        if (currentPlayer) {

            if (!inViewPortBol && currentPlayer.classList.contains("is-playing")) {

                for (i = 0; i < ytVideoElements.length; i++) {
                    if (currentPlayer != ytVideoElements[i]) {
                        ytVideoElements[i].classList.remove("is-sticky");
                    }
                }

                for (i = 0; i < videoTags.length; i++) {
                    if (currentPlayer != videoTags[i]) {
                        videoTags[i].classList.remove("is-sticky");
                    }
                }

                if (currentPlayer) {
                    currentPlayer.classList.add("is-sticky");
                    openFloatVideo();
                }

            } else if (!inViewPortBol && currentPlayer.classList.contains("is-paused")) {

                //Do nothing

            } else {
                if (currentPlayer.classList.contains("is-sticky")) {
                    closeFloatVideo(currentPlayer);
                }

            }
        }
    });

    function inViewPort() {
        if (currentPlayer) {
            var videoParentLocal = currentPlayer.parentElement.getBoundingClientRect();
            return videoParentLocal.bottom > 0 &&
                videoParentLocal.right > 0 &&
                videoParentLocal.left < (window.innerWidth || document.documentElement.clientWidth) &&
                videoParentLocal.top < (window.innerHeight || document.documentElement.clientHeight);
        }
    }

    function openFloatVideo() {
        closeButton.style.display = "block";
    }

    function closeFloatVideo(currentPlayer) {
        closeButton.style.display = "none";
        currentPlayer.classList.remove("is-sticky");
    }
})();