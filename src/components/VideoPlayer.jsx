import React, { useState, useEffect, useRef } from 'react'
import SwipeContainer from './swipeContainer'
import fetchData from '../data/fetchData'
import '../styles/videoPlayer.css'
import Message from './Message'

const VideoPlayer = () => {
    const [height, setHeight] = useState(window.innerHeight)
    const [width, setWidth] = useState(window.innerWidth)
    const [numElem, setNumElem] = useState(10)
    const { current: refObj } = useRef({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [mute, setMute] = useState(true)
    const count = useRef(7)
    const vid = useRef(0)
    const [data, setData] = useState([])
    const touchScreen = 'ontouchstart' in window
    const playCurrent = () => {
        refObj[vid.current] &&
            refObj[vid.current]
                .play()
                .then(() => setLoading(false))
                .catch((e) => {
                    console.error(e)
                    setError(true)
                    setLoading(false)
                })
    }
    const pauseCurrent = () => {
        refObj[vid.current] && refObj[vid.current].pause()
    }
    useEffect(() => {
        setData(fetchData())
        const resizeHandler = () => {
            setHeight(window.innerHeight)
            setWidth(window.innerWidth)
        }
        window.addEventListener('resize', resizeHandler)
        return () => window.removeEventListener('resize', resizeHandler)
    }, [])

    useEffect(() => {
        setLoading(true)
        setError(false)
        playCurrent()
    }, [data])
    const children = data.slice(0, numElem).map(({ video, channel }, i) => (
        <SwipeContainer
            height={height}
            width={width}
            direction='X'
            maxOffsetMultiplier={1}
            key={i}
            callback={(direction) => {
                    if (direction === -1) playCurrent()
                    else pauseCurrent()
            }}
        >
            <div className='video-unit-container'>
                <div className='video-unit'>
                    <video
                        /**
                         * directly using source because can't preload in async because of CORS policy on content
                         */
                        src={video && video.originalUrl}
                        poster={video && video.coverImageUrl}
                        preload='metadata'
                        height={height}
                        width={width}
                        ref={(vidRef) => (refObj[i] = vidRef)}
                        loop={true}
                        muted={mute}
                    />
                    {loading && touchScreen ? <Message message='loading...' /> : null}
                    {error && touchScreen ? <Message message='Something went wrong.' /> : null}
                </div>
                <div className='name-container' style={{ width, height }}>
                    <span>{channel && channel.user.name}</span>
                </div>
            </div>
        </SwipeContainer>
    ))
    const swipeCallback = (direction) => {
        count.current -= direction
        if (count.current === 0) {
            count.current = 7
            setNumElem(numElem + 8)
        }
        pauseCurrent()
        vid.current += direction
        setLoading(true)
        setError(false)
        playCurrent()
    }
    return (
        <div className='main' onClick={() => setMute(!mute)}>
            <SwipeContainer
                height={height}
                width={width}
                direction='Y'
                callback={swipeCallback}
                maxOffsetMultiplier={data.length - 1}
            >
                {children}
            </SwipeContainer>
            {touchScreen ? null : <Message message='Touch not Supported. Click based version is not implemented yet. Use Chrome Dev tool to examine it with touch.' />}
        </div>
    )
}

export default VideoPlayer
