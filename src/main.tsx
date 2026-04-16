import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
// Defer RainbowKit CSS — not needed for initial paint
import './index.css'
import App from './App'
import { config } from './wagmi'

const queryClient = new QueryClient()

function Root() {
  useEffect(() => {
    // Load RainbowKit styles after first paint
    import('@rainbow-me/rainbowkit/styles.css')
  }, [])

  return (
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#00ffc8',
              accentColorForeground: '#0a0a0f',
              borderRadius: 'medium',
              fontStack: 'system',
            })}
          >
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
