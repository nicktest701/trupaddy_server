const emailVerificationText = (htmlText) => {
  return `<!DOCTYPE html>
       <html lang="en">
      
       <head>
           <meta charset="UTF-8">
           <meta http-equiv="X-UA-Compatible" content="IE=edge">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <link rel="preconnect" href="https://fonts.googleapis.com">
           <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
           <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;400;700&display=swap" rel="stylesheet">
           <title>Document</title>
      
           <style>
               *,
               *::after,
               *::before {
                   margin: 0;
                   padding: 0;
                   box-sizing: border-box;
               }
      
               html {
                   scroll-behavior: smooth;
               }
      
               body {
                   font-family: "Poppins",sans-serif;
      
                   -webkit-font-smoothing: antialiased;
                   -moz-osx-font-smoothing: grayscale;
                   font-size: 14px !important;
                   font-weight: 500 !important;
                   width: 100%;
                   min-height: 100vh;
               }
           </style>
       </head>
      
       <body style='font-family: "Poppins",sans-serif;background-color:whitesmoke;padding:16px;color:#333;'>
  
       <div>
       
       
  <p>Hi  ${htmlText.name}! </p>
  
  Your verification code is <p style='display:block;font-size:24px;'>${htmlText.code}</p>.
  
  Enter this code in verification page in our app to activate your account.
  
  If you have any questions, send us an email trupaddy160@gmail.com.
  
  We’re glad you’re here!
  The Truepaddy team
       </div>
     
       </body>
       </html>
      
       `;
};

const forgotPasswordText = (code) => {
  return `<!DOCTYPE html>
         <html lang="en">
        
         <head>
             <meta charset="UTF-8">
             <meta http-equiv="X-UA-Compatible" content="IE=edge">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <link rel="preconnect" href="https://fonts.googleapis.com">
             <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
             <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;400;700&display=swap" rel="stylesheet">
             <title>Document</title>
        
             <style>
                 *,
                 *::after,
                 *::before {
                     margin: 0;
                     padding: 0;
                     box-sizing: border-box;
                 }
        
                 html {
                     scroll-behavior: smooth;
                 }
        
                 body {
                     font-family: "Poppins",sans-serif;
        
                     -webkit-font-smoothing: antialiased;
                     -moz-osx-font-smoothing: grayscale;
                     font-size: 14px !important;
                     font-weight: 500 !important;
                     width: 100%;
                     min-height: 100vh;
                 }
             </style>
         </head>
        
         <body style='font-family: "Poppins",sans-serif;background-color:whitesmoke;padding:16px;color:#333;'>
    
         <div>
          
<p>Hi there,</p>

<p>You recently requested to reset the password for your trupaddy account.</p>

<p>Your password reset token is <p style='display:block;font-size:24px;'>${code}</p>.

<p>If you did not request a password reset, please ignore this email or reply to let us know. This password token  is only valid for the next 30 minutes.</p>

Thanks, the TRUPADDY team
         </div>     
         </body>
         </html>
        
         `;
};

module.exports = {
  emailVerificationText,
  forgotPasswordText
};
