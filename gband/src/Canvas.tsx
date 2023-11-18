import { chart } from "mk-60fps"
import React, { useEffect, useRef } from 'react'
import { JSX } from 'react/jsx-runtime';
import useAnimationFrame from './hooks/useAnimationRequest';
type Props = React.CanvasHTMLAttributes<HTMLCanvasElement> & {
	dataGet: () => Float32Array
};
const Canvas = ({ dataGet, ...canvasProps }: Props) => {

	const canvasRef = useRef<HTMLCanvasElement>(null)
	useEffect(() => {
		if (!canvasRef.current) return;
		const canvas = canvasRef.current
		const context = canvasRef.current.getContext('2d');
		if (!context) return;

		return function cleanup() {

		}
	})
	useAnimationFrame(() => {
		if (!canvasRef.current) return;
		const canvas = canvasRef.current
		const context = canvasRef.current.getContext('2d');
		if (context) chart(context, dataGet());
	})
	return <canvas ref={canvasRef} {...canvasProps} />
}

export default Canvas