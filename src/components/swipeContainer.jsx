import React, { useRef, useState, useEffect } from 'react'
import '../styles/swipeContainer.css'

const THRESHOLD_SPEED = 20
const AnimationDuration = '0.2s'
const X = 'X'
const Y = 'Y'

const swipeDiff = ({ x: x1, y: y1 }, { x: x2, y: y2 }, swipeDirection) => {
    let dx = x1 - x2
    let dy = y1 - y2
    return swipeDirection === Y ? dy : dx
}

const swipeDirection = ({ x: x1, y: y1 }, { x: x2, y: y2 }) => {
    let dx = Math.abs(x1 - x2)
    let dy = Math.abs(y1 - y2)
    return dy > dx ? Y : X
}

const swipeSign = ({ x: x1, y: y1 }, { x: x2, y: y2 }, swipeDirection = Y) => {
    if (swipeDirection === Y) {
        return y2 > y1 ? -1 : 1
    } else {
        return x2 > x1 ? -1 : 1
    }
}

const swipeLength = ({ x: x1, y: y1 }, { x: x2, y: y2 }, swipeDirection = Y) => {
    let dx = Math.abs(x1 - x2)
    let dy = Math.abs(y1 - y2)
    return swipeDirection === Y ? dy : dx
}

const swipeSpeed = ({ x: x1, y: y1, time: t1 }, { x: x2, y: y2, time: t2 }, swipeDirection = Y) => {
    let dx = Math.abs(x1 - x2)
    let dy = Math.abs(y1 - y2)
    let dt = Math.abs(t1 - t2)
    if (dt === 0) return 0
    let speed = swipeDirection === Y ? dy / dt : dx / dt
    return speed * 100
}

/**
 * This Component assumes touch input is available, click and scroll based
 * implementation can be added, but I'm skipping due to lack of time. and also because
 * this won't be best UX for desktop, a separate website or at least component should be
 * used for desktop.
 */
const SwipeContainer = ({
    height,
    width,
    children,
    direction = Y,
    callback,
    onlyCallback = false,
    maxOffsetMultiplier = Infinity,
    minOffsetMultiplier = 0,
}) => {
    const containerRef = useRef()
    const { current: touchInfo } = useRef({})
    const [tempOffset, setTempOffset] = useState(0)
    const [offsetMultiplier, setOffsetMultiplier] = useState(0)
    const offsetChangeSign = useRef(null)
    const mainLength = direction === Y ? height : width
    const transTime = tempOffset === 0 ? AnimationDuration : '0s'
    const transValue = 0 - offsetMultiplier * mainLength + tempOffset
    const [transX, transY] = [direction === X ? transValue : 0, direction === Y ? transValue : 0]

    // using translate3d for GPU acceleration
    const transform = onlyCallback ? undefined : `translate3d(${transX}px, ${transY}px, 0)`

    useEffect(() => {
        
    }, [offsetMultiplier])

    const touchStartHandler = (e) => {
        if (e.touches.length === 1) {
            const [touch] = e.touches
            touchInfo.start = {
                identifier: touch.identifier,
                time: Date.now(),
                x: touch.pageX,
                y: touch.pageY
            }
        }
    }
    const touchMoveHandler = (e) => {
        if (e.targetTouches.length === 1) {
            const [touch] = e.targetTouches
            touchInfo.end = {
                identifier: touch.identifier,
                time: Date.now(),
                x: touch.pageX,
                y: touch.pageY
            }
            const { start, end } = touchInfo
            if (typeof touchInfo.initialDirection === 'undefined') {
                touchInfo.initialDirection = swipeDirection(start, end)
            }
            if (
                touchInfo.initialDirection === direction &&
                end.identifier === start.identifier &&
                (offsetMultiplier !== minOffsetMultiplier || swipeSign(start, end, direction) === 1) &&
                (offsetMultiplier !== maxOffsetMultiplier || swipeSign(start, end, direction) === -1)
            ) {
                const diff = swipeDiff(end, start, direction)
                setTempOffset(diff)
            }
        }
    }
    const touchEndHandler = (_e) => {
        const { start, end } = touchInfo
        const shouldSwipe =
            touchInfo.initialDirection === direction &&
            end.identifier === start.identifier &&
            direction === swipeDirection(start, end) &&
            (swipeSpeed(start, end, direction) > THRESHOLD_SPEED ||
                swipeLength(start, end, direction) > mainLength / 3)
        if (shouldSwipe) {
            let newOffsetMultiplier = offsetMultiplier + swipeSign(start, end, direction)
            newOffsetMultiplier = Math.max(
                Math.min(newOffsetMultiplier, maxOffsetMultiplier),
                minOffsetMultiplier
            )
            offsetChangeSign.current = newOffsetMultiplier - offsetMultiplier
            setOffsetMultiplier(newOffsetMultiplier)
            if (callback instanceof Function)
                callback(offsetChangeSign.current, offsetMultiplier)
        }
        setTempOffset(0)
        delete touchInfo.initialDirection
    }
    return (
        <div
            ref={containerRef}
            onTouchStart={touchStartHandler}
            onTouchMove={touchMoveHandler}
            onTouchEnd={touchEndHandler}
            className='swipe-container'
            style={{ height, width }}
        >
            {children.map instanceof Function ? (
                children.map((child, i) => (
                    <div
                        style={{ transform, height, width, transitionDuration: transTime }}
                        className='swipe-moving'
                        key={i}
                    >
                        {child}
                    </div>
                ))
            ) : (
                <div
                    style={{ transform, height, width, transitionDuration: transTime }}
                    className='swipe-moving'
                >
                    {children}
                </div>
            )}
        </div>
    )
}

export default SwipeContainer
