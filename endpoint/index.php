<?php

    // Update timestamp
    if(isset($_GET['password'])){
        $password = file_get_contents('../private/password.txt');
        $password = trim($password);
        if($_GET['password'] == $password){
            file_put_contents('../private/last_updated.txt', date('Y-m-d H:i:s'));
        }
    }

    // Fetch timestamp
    $last_updated = file_get_contents('../private/last_updated.txt');

    // Last update within 10 minutes?
    $status = (strtotime($last_updated) > strtotime("-10 minutes") ? 'online' : 'offline');
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="theme-color" content="#<?php echo (($status == 'online') ? 'dff0d8' : 'f2dede' );?>">

        <title>Is Kingsley Online?</title>

        <meta content="Is Kingsley Online?" property="og:title" />
        <meta content="website" property="og:type" />
        <meta content="Don't know if Kingsley is online? Find out here" property="og:description" />
        <meta content="http://iskingsley.online" property="og:url" />
        <meta content="/preview-image.png" property="og:image" />

        <meta content="summary_large_image" name="twitter:card" />
        <meta content="Is Kingsley Online?" name="twitter:title" />
        <meta content="Don't know if Kingsley is online? Find out here" name="twitter:description" />
        <meta content="/preview-image.png" name="twitter:image" />
        <meta content="http://iskingsley.online" name="twitter:url" />

        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">

        <!--[if lt IE 9]>
            <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
            <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->

        <style>
            html,body, .status {
                height: 100%;
            }
            body.kingsley--is-online{
                background-color:#dff0d8;
            }
            body.kingsley--is-offline{
                background-color: #f2dede;
            }
            .status{
                display: -ms-flexbox;
                display: -webkit-flex;
                display: flex;
                -ms-flex-align: center;
                -webkit-align-items: center;
                -webkit-box-align: center;.
                align-items: center;
                justify-content: center;
                height: 100%;
                font-size: 10em;
                font-weight: bold;
            }
        </style>

        <script>
            !function(I,s,O,n,l,y,N){I.GoogleAnalyticsObject=O;I[O]||(I[O]=function(){
            (I[O].q=I[O].q||[]).push(arguments)});I[O].l=+new Date;y=s.createElement(n);
            N=s.getElementsByTagName(n)[0];y.src=l;N.parentNode.insertBefore(y,N)}
            (window,document,'ga','script','//www.google-analytics.com/analytics.js');

            ga('create', 'UA-21583989-3', 'auto');
            ga('send', 'pageview');
        </script>
    </head>
    <body id="app" class="kingsley--is-<?php echo $status;?>">
        <main role="main" class="status">
            <?php if($status == 'online'){
                echo '<i class="fa fa-thumbs-up" aria-hidden="true"></i>';
            }else{
                echo '<i class="fa fa-thumbs-down" aria-hidden="true"></i>';
            }?>
        </main>
    </body>
</html>