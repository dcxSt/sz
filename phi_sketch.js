new p5((p) => {
        let canvas;
        let thetaiSlider;
        let betaSlider;
        let isCrossSection; // checkbox
        let time;
        let fr;
        let betaMax;

        p.setup = function() {
          //let container = p.createDiv('');
          //container.id('canvasContainer');
          //container.style('position', 'relative');

          canvas = p.createCanvas(400, 400);
          canvas.parent('p5-sketch');

          time = 0;
          fr = 60; // 60 Hz
          p.frameRate(fr);

          // Theta Incident slider
          thetaiSlider = p.createSlider(0, p.PI, p.PI / 4, 0.01);
          thetaiSlider.position(10, 10);
          thetaiSlider.style('width', '150px');
          thetaiSlider.parent('p5-sketch');
          // beta slider
          betaMax = 0.1;
          betaSlider = p.createSlider(0, betaMax, 0.1, 0.001);
          betaSlider.position(10, 30);
          betaSlider.style('width', '150px');
          betaSlider.parent('p5-sketch');
          // Checkbox
          isCrossSection = p.createCheckbox('Cross Section', true);
          isCrossSection.parent('p5-sketch');
          p.plotPhi(thetaiSlider.value(), betaSlider.value());
        };

        p.draw = function() {
          time = time + 1 / fr;
          p.clear();
          // Sliders
          p.textSize(15);
          p.text('Beta (0 to ' + betaMax + ')', betaSlider.x + betaSlider.width + 10, betaSlider.y + 15);
          p.text('Theta Incident', thetaiSlider.x + thetaiSlider.width + 10, thetaiSlider.y + 15);

          //
          p.drawGrid();
          p.textSize(18);
          p.text('0', p.width * 5 / 6, p.height / 2 + 5);
          p.text('-π/2', p.width / 2 - 15, p.height * 8 / 9);
          p.text('π', p.width * 1 / 9, p.height / 2 + 5)
          p.plotPhi(thetaiSlider.value(), betaSlider.value());
        };

        p.polarToCart = function(r, theta) {
          let x = r * p.cos(theta);
          let y = r * p.sin(theta);
          return [x, y];
        };

        p.phi = function(theta_o, theta_i) {
          let muo = p.cos(theta_o);
          let mui = p.cos(theta_i);
          return 3 / 8 * (1 + mui ** 2 * muo ** 2 + 0.5 * (1 - mui ** 2) * (1 - muo ** 2));
        };

        p.plotPhi = function(theta_i, beta) {
          let thetas = [];
          for (let i = -p.PI; i <= p.PI; i += (2 * p.PI) / 1000) {
            thetas.push(i);
          };
          let scale_up = 100; // for plotting purposes
          let r = thetas.map(theta_o => scale_up * p.phi(theta_o, theta_i));
          let rsintheta = r.map((val, i) => val * p.abs(p.sin(thetas[i])));

          let x = [];
          let y = [];
          let xst = [];
          let yst = [];

          for (let i = 0; i < thetas.length; i++) {
            let [cartX, cartY] = p.polarToCart(r[i], thetas[i]);
            x.push(cartX);
            y.push(cartY);
            let [cartXst, cartYst] = p.polarToCart(rsintheta[i], thetas[i]);
            xst.push(cartXst);
            yst.push(cartYst);
          };

          // Draw the plots
          p.push(); // Start a new drawing state
          p.translate(p.width / 2, p.height / 2); // Translate to center of canvas
          p.scale(1, -1); // Invert the y-axis
          for (let i = 0; i < thetas.length - 1; i++) {
            let muo = p.cos(thetas[i]);
            let mui = p.cos(theta_i);
            // energy out / energy in
            let nu_ratio = (1 + beta * muo) / (1 - beta * mui);
            let numax = (1 + betaMax) / (1 - betaMax);
            let numin = (1 - betaMax) / (1 + betaMax);
            let logmax = p.log(numax);
            let logmin = p.log(numin);
            let inter = p.map(p.log(nu_ratio), logmin, logmax, 0, 1);
            let c = p.lerpColor(p.color(255, 50, 0), p.color(0, 50, 255), inter);
            let x1;
            let y1;
            let x2;
            let y2;
            if (isCrossSection.checked()) {
              x1 = x[i];
              y1 = y[i];
              x2 = x[i + 1];
              y2 = y[i + 1];
            } else {
              x1 = xst[i];
              y1 = yst[i];
              x2 = xst[i + 1];
              y2 = yst[i + 1];
            };
            p.stroke(c);
            p.strokeWeight(5);
            p.line(x1, y1, x2, y2);
          };

          let speedPhoton = 2;
          p.animate_wiggly(time, speedPhoton, scale_up, theta_i);
          p.animate_wiggly(time + 1.5 / speedPhoton, speedPhoton, scale_up, theta_i);

          p.pop(); // Restore original drawing state
        };

        p.drawGrid = function() {
          p.stroke(200); // Light grey color for the grid lines
          p.strokeWeight(1); // Thin lines

          // Draw vertical lines
          for (let x = 0; x <= p.width; x += 50) { // Adjust the spacing as needed
            p.line(x, 0, x, p.height);
          };

          // Draw horizontal lines
          for (let y = 0; y <= p.height; y += 50) { // Adjust the spacing as needed
            p.line(0, y, p.width, y);
          };
        };

        p.animate_wiggly = function(t, speedPhoton, scale_up, theta_i) {
          let [inX, inY] = p.polarToCart(scale_up * (-((t * speedPhoton) % 3) + 3), theta_i); // Photon in
          p.strokeWeight(3);
          let photonInter = p.map((t * speedPhoton) % 3, 0, 3, 0, 1);
          let cPhoton = p.lerpColor(p.color(0, 200, 0, 255), p.color(0, 200, 0, 0), photonInter);
          p.stroke(cPhoton);
          p.wiggly(inX, inY, 0.1, -theta_i);
          p.wiggly(inX, -inY, 0.1, +theta_i);
        };

        p.wiggly = function(cx, cy, size, theta) {
          p.beginShape();
          p.noFill();
          p.curveVertex(cx + p.cos(theta) * size * 0 + p.sin(theta) * size * 0,
            cy + -p.sin(theta) * size * 0 + p.cos(theta) * size * 0);
          p.curveVertex(cx + p.cos(theta) * size * 50 + p.sin(theta) * size * (-50),
            cy + -p.sin(theta) * size * 50 + p.cos(theta) * size * (-50));
          p.curveVertex(cx + p.cos(theta) * size * 100 + p.sin(theta) * size * 50,
            cy + -p.sin(theta) * size * 100 + p.cos(theta) * size * 50);
          p.curveVertex(cx + p.cos(theta) * size * 150 + p.sin(theta) * size * (-50),
            cy + -p.sin(theta) * size * 150 + p.cos(theta) * size * (-50));
          p.curveVertex(cx + p.cos(theta) * size * 200 + p.sin(theta) * size * 50,
            cy + -p.sin(theta) * size * 200 + p.cos(theta) * size * 50);
          p.curveVertex(cx + p.cos(theta) * size * 250 + p.sin(theta) * size * (-50),
            cy + -p.sin(theta) * size * 250 + p.cos(theta) * size * (-50));
          p.curveVertex(cx + p.cos(theta) * size * 300 + p.sin(theta) * size * 50,
            cy + -p.sin(theta) * size * 300 + p.cos(theta) * size * 50);
          p.curveVertex(cx + p.cos(theta) * size * 350 + p.sin(theta) * size * 0,
            cy + -p.sin(theta) * size * 350 + p.cos(theta) * size * 0);
          p.endShape();
        };
});
