'use client'

import { useState, useEffect } from 'react';
import Head from 'next/head'
import styles from './styles/Home.module.css'
import Participant from './components/Participant';
import Interviewer from './components/Interviewer';
import SpeechToText from './components/SpeechToText';
import { OpenAI } from 'openai';

require('dotenv').config();

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [recording, setRecording] = useState(false);
  const openai = new OpenAI({ apiKey: 'PUT API KEY HERE' || '', dangerouslyAllowBrowser: true});
  let questionsString = '';

  type ChatMessage = { sender: string; content: string; };

  const fetchData = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/behavioral', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const behavioralQuestions = data.behavioral;
          const questions = data.questions;
          const resumeQuestions = data.resume;
  
          // Concatenating questions into a single string
          const allQuestions = [
            ...behavioralQuestions,
            ...questions,
            ...resumeQuestions
          ];
          questionsString = "You must ask these questions in this exact order before engaging in any other conversation: " + allQuestions.join(", ");
        }
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();

  useEffect(() => {
    if (transcript !== '' && recording) {
      handleUserInput(transcript);
    }
  }, [transcript, recording]);

  const handleUserInput = async (message: string) => {
    setChatMessages([...chatMessages, { sender: 'user', content: message }]);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an interviewer from Bain who will be conducting a consulting interview today with a potential applicant." + questionsString },
        { role: "user", content: message }
      ],
    });

    setChatMessages([...chatMessages, { sender: 'AI', content: response.choices[0].message.content || '' }]);
  };

  const startRecording = () => {
    setRecording(true);
    setTranscript('');
  };

  const endRecording = () => {
    setRecording(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mock Zoom Call</title>
        <meta name="description" content="Mock Zoom Call" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to your mock interview
        </h1>

        <div className={styles.grid}>
          <Interviewer videoUrl="https://www.youtube.com/watch?v=g6ib_I9ukZA&ab_channel=BloombergTelevision" />
          <Participant name="Participant 2" />
          <SpeechToText onTranscriptChange={setTranscript} recording={recording} />
        </div>
        <div>
          <button onClick={startRecording}>Start Recording</button>
          <button onClick={endRecording}>End Recording</button>
        </div>
        <p>{transcript}</p> {/* display the transcript */}
        {chatMessages.map((message, index) => (
          <p key={index}><strong>{message.sender}:</strong> {message.content}</p>
        ))}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </footer>
    </div>
  )
}