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

        <title>Is Kingsley Online?</title>

        <!-- CSS -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">


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
                font-size: 5em;
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