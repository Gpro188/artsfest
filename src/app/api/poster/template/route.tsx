import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'WITH_PHOTO';
    const alignRaw = searchParams.get('align') || 'CENTER';
    
    const alignItems = alignRaw === 'LEFT' ? 'flex-start' : alignRaw === 'RIGHT' ? 'flex-end' : 'center';
    const textAlign = alignRaw === 'LEFT' ? 'left' : alignRaw === 'RIGHT' ? 'right' : 'center';
    
    const textColor = 'white';
    const primaryColor = '#FCD34D';
    const secondaryColor = '#4F46E5';
    
    // Create a subtle grid pattern for the background
    const bgImage = `data:image/svg+xml;utf8,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M40 0L0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>`;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: alignItems,
            width: '100%',
            height: '100%',
            backgroundColor: '#0F172A',
            backgroundImage: `url('${bgImage}')`,
            backgroundRepeat: 'repeat',
            paddingBottom: '120px',
            paddingLeft: '60px',
            paddingRight: '60px',
            color: textColor,
            fontFamily: 'sans-serif',
            textAlign: textAlign,
          }}
        >
          {/* Overlay gradient for readability */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            display: 'flex'
          }} />
          
          {/* Watermark in center */}
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '60px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.1)',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            display: 'flex'
          }}>
            DESIGN TEMPLATE MAP
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: alignItems, zIndex: 10, width: '100%' }}>
            
            {/* Candidate Photo (if applicable) */}
            {type === 'WITH_PHOTO' && (
              <div style={{ 
                marginBottom: '20px',
                borderRadius: '50%',
                width: '300px',
                height: '300px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: `8px dashed ${primaryColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.5)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                [PHOTO AREA]
              </div>
            )}

            <h1 style={{ 
              fontSize: '80px', 
              fontWeight: 800, 
              margin: '0 0 20px 0', 
              textTransform: 'uppercase', 
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.7)',
              border: '2px dashed rgba(255,255,255,0.3)',
              padding: '10px 20px',
            }}>
              WINNER NAME HERE
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: alignItems }}>
              <span style={{ 
                  fontSize: '40px', 
                  fontWeight: 600, 
                  color: primaryColor, 
                  marginRight: '20px',
                  border: `2px dashed ${primaryColor}`,
                  padding: '5px 10px'
              }}>
                1ST PLACE
              </span>
              <span style={{ 
                  fontSize: '30px', 
                  background: secondaryColor, 
                  padding: '5px 20px', 
                  borderRadius: '50px', 
                  color: textColor,
                  border: '2px dashed rgba(255,255,255,0.5)'
              }}>
                TEAM NAME
              </span>
            </div>
            
            <p style={{ 
                fontSize: '35px', 
                margin: 0, 
                opacity: 0.9,
                border: '2px dashed rgba(255,255,255,0.3)',
                padding: '5px 10px',
            }}>
              PROGRAM NAME (CATEGORY)
            </p>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate the template`, {
      status: 500,
    });
  }
}
